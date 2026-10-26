package com.fotorutas.app;

import android.app.Dialog;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.provider.OpenableColumns;
import android.util.Base64;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;
import android.widget.TextView;

import androidx.core.content.FileProvider;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class MainActivity extends BridgeActivity {

    private WebView mainWebView = null;
    private static String pendingTrackJson = null;
    private Dialog garminDialog = null;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Ensure system navigation buttons and status bar do not overlap web content
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);

        View contentView = findViewById(android.R.id.content);
        if (contentView != null) {
            ViewCompat.setOnApplyWindowInsetsListener(contentView, (v, windowInsets) -> {
                Insets insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());
                v.setPadding(insets.left, insets.top, insets.right, insets.bottom);
                return windowInsets;
            });
        }

        // Add Native Gallery, Track & Garmin Bridge to WebView
        View webViewCandidate = findViewById(com.getcapacitor.android.R.id.webview);
        if (webViewCandidate instanceof WebView) {
            mainWebView = (WebView) webViewCandidate;
            mainWebView.addJavascriptInterface(new GalleryBridge(this), "AndroidGallery");
        }

        // Handle incoming intent if app was opened with a .gpx or .fit file
        handleIncomingIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIncomingIntent(intent);
    }

    private void handleIncomingIntent(Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        Uri uri = null;
        if (Intent.ACTION_VIEW.equals(action)) {
            uri = intent.getData();
        } else if (Intent.ACTION_SEND.equals(action)) {
            uri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
        }

        if (uri != null) {
            readAndDispatchTrackUri(uri);
        }
    }

    private void readAndDispatchTrackUri(Uri uri) {
        new Thread(() -> {
            try {
                String fileName = "track.gpx";
                try (Cursor cursor = getContentResolver().query(uri, null, null, null, null)) {
                    if (cursor != null && cursor.moveToFirst()) {
                        int nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                        if (nameIndex >= 0) {
                            String name = cursor.getString(nameIndex);
                            if (name != null && !name.isEmpty()) {
                                fileName = name;
                            }
                        }
                    }
                } catch (Exception ignored) {}

                if ("track.gpx".equals(fileName) && uri.getLastPathSegment() != null) {
                    fileName = uri.getLastPathSegment();
                }

                try (InputStream in = getContentResolver().openInputStream(uri);
                     ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                    if (in == null) return;
                    byte[] buffer = new byte[8192];
                    int read;
                    while ((read = in.read(buffer)) != -1) {
                        out.write(buffer, 0, read);
                    }
                    byte[] data = out.toByteArray();
                    String base64 = Base64.encodeToString(data, Base64.NO_WRAP);
                    dispatchTrackData(base64, fileName);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }).start();
    }

    public void dispatchTrackData(String base64, String fileName) {
        JSONObject obj = new JSONObject();
        try {
            obj.put("base64", base64);
            obj.put("fileName", fileName);
            pendingTrackJson = obj.toString();
        } catch (Exception e) {
            e.printStackTrace();
        }

        runOnUiThread(() -> {
            if (mainWebView != null && pendingTrackJson != null) {
                String safeJson = JSONObject.quote(pendingTrackJson);
                mainWebView.evaluateJavascript("if (window.handleNativeTrackImport) { window.handleNativeTrackImport(" + safeJson + "); }", null);
            }
        });
    }

    public void startGarminActivityImport(final String activityId) {
        // Step 1: Check if we have cookies for connect.garmin.com in CookieManager to fetch directly
        String cookie = CookieManager.getInstance().getCookie("https://connect.garmin.com");

        new Thread(() -> {
            boolean success = false;
            if (cookie != null && (cookie.contains("SESSION") || cookie.contains("GARMIN") || cookie.contains("token"))) {
                success = tryDirectGarminDownload(activityId, cookie);
            }

            if (!success) {
                // Step 2: Open in-app dialog with embedded WebView so the user can authenticate once
                runOnUiThread(() -> showGarminLoginDialog(activityId));
            }
        }).start();
    }

    private boolean tryDirectGarminDownload(String activityId, String cookie) {
        try {
            String urlStr = "https://connect.garmin.com/download-service/export/gpx/activity/" + activityId;
            URL url = new URL(urlStr);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36");
            conn.setRequestProperty("Accept", "application/gpx+xml,application/xml,text/xml,*/*");
            conn.setRequestProperty("DI-Backend", "connectapi.garmin.com");
            if (cookie != null) {
                conn.setRequestProperty("Cookie", cookie);
            }
            conn.setInstanceFollowRedirects(true);
            conn.connect();

            int code = conn.getResponseCode();
            if (code == 200) {
                try (InputStream in = conn.getInputStream();
                     ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                    byte[] buffer = new byte[8192];
                    int read;
                    while ((read = in.read(buffer)) != -1) {
                        out.write(buffer, 0, read);
                    }
                    byte[] data = out.toByteArray();
                    String text = new String(data, "UTF-8");
                    if (text.contains("<gpx") || text.contains("<?xml")) {
                        String base64 = Base64.encodeToString(data, Base64.NO_WRAP);
                        dispatchTrackData(base64, "garmin_" + activityId + ".gpx");
                        return true;
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    private void showGarminLoginDialog(final String activityId) {
        if (isFinishing() || isDestroyed()) return;
        if (garminDialog != null && garminDialog.isShowing()) {
            garminDialog.dismiss();
        }

        garminDialog = new Dialog(this, android.R.style.Theme_DeviceDefault_Light_NoActionBar_Fullscreen);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(0xFF0F172A);

        // Top bar
        RelativeLayout topBar = new RelativeLayout(this);
        topBar.setPadding(32, 28, 32, 20);
        topBar.setBackgroundColor(0xFF1E293B);

        TextView titleView = new TextView(this);
        titleView.setText("Conectar con Garmin Connect");
        titleView.setTextColor(0xFFFFFFFF);
        titleView.setTextSize(16);
        titleView.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        RelativeLayout.LayoutParams titleLp = new RelativeLayout.LayoutParams(
                RelativeLayout.LayoutParams.WRAP_CONTENT,
                RelativeLayout.LayoutParams.WRAP_CONTENT
        );
        titleLp.addRule(RelativeLayout.ALIGN_PARENT_LEFT);
        titleLp.addRule(RelativeLayout.CENTER_VERTICAL);
        topBar.addView(titleView, titleLp);

        Button closeBtn = new Button(this);
        closeBtn.setText("✕ Cerrar");
        closeBtn.setTextColor(0xFF94A3B8);
        closeBtn.setBackgroundColor(0x00000000);
        RelativeLayout.LayoutParams closeLp = new RelativeLayout.LayoutParams(
                RelativeLayout.LayoutParams.WRAP_CONTENT,
                RelativeLayout.LayoutParams.WRAP_CONTENT
        );
        closeLp.addRule(RelativeLayout.ALIGN_PARENT_RIGHT);
        closeLp.addRule(RelativeLayout.CENTER_VERTICAL);
        closeBtn.setOnClickListener(v -> garminDialog.dismiss());
        topBar.addView(closeBtn, closeLp);

        root.addView(topBar);

        // Instruction Banner
        TextView banner = new TextView(this);
        banner.setText("Inicia sesión en tu cuenta de Garmin. Al entrar, tu ruta se importará automáticamente en Rutagram.");
        banner.setTextColor(0xFFF0FDF4);
        banner.setTextSize(12);
        banner.setPadding(32, 20, 32, 20);
        banner.setBackgroundColor(0xFF0284C7);
        root.addView(banner);

        // Embedded WebView
        WebView webView = new WebView(this);
        webView.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.MATCH_PARENT
        ));
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setUserAgentString("Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36");

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

        // Native JS interface to receive GPX from in-page scripts
        webView.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public void onGpxCaptured(String gpxData) {
                if (gpxData != null && (gpxData.contains("<gpx") || gpxData.contains("<?xml"))) {
                    byte[] bytes = gpxData.getBytes(java.nio.charset.StandardCharsets.UTF_8);
                    String base64 = Base64.encodeToString(bytes, Base64.NO_WRAP);
                    dispatchTrackData(base64, "garmin_" + activityId + ".gpx");
                    runOnUiThread(() -> {
                        if (garminDialog != null && garminDialog.isShowing()) {
                            garminDialog.dismiss();
                        }
                    });
                }
            }
        }, "GarminNativeCapture");

        final String jsInjectScript = "(function() {" +
                "  if (window._rutagramInjected) return;" +
                "  window._rutagramInjected = true;" +
                "  var actId = '" + activityId + "';" +
                "  function tryFetchGpx() {" +
                "    var token = null;" +
                "    try {" +
                "      var raw = localStorage.getItem('token');" +
                "      if (raw) {" +
                "        var p = JSON.parse(raw);" +
                "        token = p.access_token || p.token || null;" +
                "      }" +
                "    } catch(e) {}" +
                "    var headers = { 'DI-Backend': 'connectapi.garmin.com', 'Accept': 'application/gpx+xml,application/xml,*/*' };" +
                "    if (token) { headers['Authorization'] = 'Bearer ' + token; }" +
                "    var urls = [" +
                "      '/download-service/export/gpx/activity/' + actId," +
                "      '/modern/proxy/download-service/export/gpx/activity/' + actId," +
                "      'https://connect.garmin.com/download-service/export/gpx/activity/' + actId" +
                "    ];" +
                "    function fetchNext(i) {" +
                "      if (i >= urls.length) {" +
                "        window.location.href = '/download-service/export/gpx/activity/' + actId;" +
                "        return;" +
                "      }" +
                "      fetch(urls[i], { method: 'GET', headers: headers, credentials: 'include' })" +
                "        .then(function(res) { if (!res.ok) throw new Error(res.status); return res.text(); })" +
                "        .then(function(txt) {" +
                "          if (txt && (txt.indexOf('<gpx') !== -1 || txt.indexOf('<?xml') !== -1)) {" +
                "            if (window.GarminNativeCapture) { window.GarminNativeCapture.onGpxCaptured(txt); }" +
                "          } else {" +
                "            fetchNext(i + 1);" +
                "          }" +
                "        })" +
                "        .catch(function() { fetchNext(i + 1); });" +
                "    }" +
                "    fetchNext(0);" +
                "  }" +
                "  tryFetchGpx();" +
                "  setTimeout(tryFetchGpx, 1500);" +
                "  try {" +
                "    if (!document.getElementById('rutagram-btn')) {" +
                "      var bar = document.createElement('div');" +
                "      bar.id = 'rutagram-btn';" +
                "      bar.style.cssText = 'position:fixed;top:12px;left:12px;right:12px;z-index:999999;background:linear-gradient(135deg,#FF5500,#F59E0B);color:#fff;padding:12px 16px;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,0.5);font-family:sans-serif;font-weight:bold;font-size:13px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;';" +
                "      bar.innerHTML = '<span>⚡ Importar esta ruta en Rutagram</span><span style=\"background:#fff;color:#000;font-size:11px;font-weight:800;padding:5px 10px;border-radius:8px;\">DESCARGAR</span>';" +
                "      bar.onclick = function() {" +
                "        bar.innerHTML = '<span>⏳ Descargando GPX...</span>';" +
                "        tryFetchGpx();" +
                "        setTimeout(function() { window.location.href = '/download-service/export/gpx/activity/' + actId; }, 1000);" +
                "      };" +
                "      document.body.appendChild(bar);" +
                "    }" +
                "  } catch(e) {}" +
                "})();";

        webView.setWebViewClient(new WebViewClient() {
            private boolean captured = false;

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                if (captured) return;

                // If on activity page or modern portal, execute script injection
                if (url.contains("/activity/") || url.contains("/modern/")) {
                    view.evaluateJavascript(jsInjectScript, null);
                    view.postDelayed(() -> {
                        if (!captured) {
                            view.evaluateJavascript(jsInjectScript, null);
                        }
                    }, 1500);
                }
            }
        });

        // Intercept any downloads triggered inside the WebView
        webView.setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) -> {
            new Thread(() -> {
                String cookies = CookieManager.getInstance().getCookie(url);
                try {
                    HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
                    if (cookies != null) {
                        conn.setRequestProperty("Cookie", cookies);
                    }
                    conn.setRequestProperty("User-Agent", userAgent);
                    conn.connect();
                    if (conn.getResponseCode() == 200) {
                        try (InputStream in = conn.getInputStream();
                             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                            byte[] buf = new byte[8192];
                            int r;
                            while ((r = in.read(buf)) != -1) {
                                out.write(buf, 0, r);
                            }
                            byte[] bytes = out.toByteArray();
                            dispatchTrackData(Base64.encodeToString(bytes, Base64.NO_WRAP), "garmin_" + activityId + ".gpx");
                            runOnUiThread(() -> {
                                if (garminDialog != null && garminDialog.isShowing()) {
                                    garminDialog.dismiss();
                                }
                            });
                        }
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }).start();
        });

        String targetUrl = "https://connect.garmin.com/signin/?service=https%3A%2F%2Fconnect.garmin.com%2Fmodern%2Factivity%2F" + activityId;
        webView.loadUrl(targetUrl);

        root.addView(webView);
        garminDialog.setContentView(root);
        garminDialog.show();
    }

    public static class GalleryBridge {
        private final MainActivity activity;
        private final Context context;

        public GalleryBridge(MainActivity activity) {
            this.activity = activity;
            this.context = activity;
        }

        @JavascriptInterface
        public String getPendingTrack() {
            String pending = pendingTrackJson;
            pendingTrackJson = null;
            return pending;
        }

        @JavascriptInterface
        public void importGarminActivity(final String activityId) {
            activity.runOnUiThread(() -> activity.startGarminActivityImport(activityId));
        }

        @JavascriptInterface
        public boolean saveImageToGallery(String base64Data, String fileName) {
            try {
                byte[] decodedBytes = Base64.decode(base64Data, Base64.DEFAULT);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentValues values = new ContentValues();
                    values.put(MediaStore.Images.Media.DISPLAY_NAME, fileName);
                    values.put(MediaStore.Images.Media.MIME_TYPE, "image/png");
                    values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/Rutagram");
                    values.put(MediaStore.Images.Media.IS_PENDING, 1);

                    Uri uri = context.getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
                    if (uri != null) {
                        try (OutputStream out = context.getContentResolver().openOutputStream(uri)) {
                            if (out != null) {
                                out.write(decodedBytes);
                                out.flush();
                            }
                        }
                        values.clear();
                        values.put(MediaStore.Images.Media.IS_PENDING, 0);
                        context.getContentResolver().update(uri, values, null, null);
                        return true;
                    }
                } else {
                    File picturesDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES);
                    File appDir = new File(picturesDir, "Rutagram");
                    if (!appDir.exists()) {
                        appDir.mkdirs();
                    }
                    File imageFile = new File(appDir, fileName);
                    try (FileOutputStream fos = new FileOutputStream(imageFile)) {
                        fos.write(decodedBytes);
                        fos.flush();
                    }
                    MediaScannerConnection.scanFile(context, new String[]{imageFile.getAbsolutePath()}, new String[]{"image/png"}, null);
                    return true;
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            return false;
        }

        @JavascriptInterface
        public boolean shareImage(String base64Data, String fileName, String title) {
            try {
                byte[] decodedBytes = Base64.decode(base64Data, Base64.DEFAULT);
                File cachePath = new File(context.getCacheDir(), "images");
                if (!cachePath.exists()) {
                    cachePath.mkdirs();
                }
                File newFile = new File(cachePath, fileName);
                try (FileOutputStream stream = new FileOutputStream(newFile)) {
                    stream.write(decodedBytes);
                    stream.flush();
                }

                Uri contentUri = FileProvider.getUriForFile(context, context.getPackageName() + ".fileprovider", newFile);
                if (contentUri != null) {
                    Intent shareIntent = new Intent();
                    shareIntent.setAction(Intent.ACTION_SEND);
                    shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    shareIntent.setDataAndType(contentUri, "image/png");
                    shareIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
                    shareIntent.putExtra(Intent.EXTRA_SUBJECT, title);
                    context.startActivity(Intent.createChooser(shareIntent, "Compartir Rutagram"));
                    return true;
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            return false;
        }
    }
}
