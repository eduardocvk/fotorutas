package com.fotorutas.app;

import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import androidx.core.content.FileProvider;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

public class MainActivity extends BridgeActivity {
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

        // Add Native Gallery & Share Bridge to WebView
        View webViewCandidate = findViewById(com.getcapacitor.android.R.id.webview);
        if (webViewCandidate instanceof WebView) {
            ((WebView) webViewCandidate).addJavascriptInterface(new GalleryBridge(this), "AndroidGallery");
        }
    }

    public static class GalleryBridge {
        private final Context context;

        public GalleryBridge(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public boolean saveImageToGallery(String base64Data, String fileName) {
            try {
                byte[] decodedBytes = Base64.decode(base64Data, Base64.DEFAULT);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentValues values = new ContentValues();
                    values.put(MediaStore.Images.Media.DISPLAY_NAME, fileName);
                    values.put(MediaStore.Images.Media.MIME_TYPE, "image/png");
                    values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/Fotorutas");
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
                    File appDir = new File(picturesDir, "Fotorutas");
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
                    context.startActivity(Intent.createChooser(shareIntent, "Compartir fotoruta"));
                    return true;
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            return false;
        }
    }
}
