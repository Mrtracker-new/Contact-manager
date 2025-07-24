package com.contactmanager.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.FileProvider;
import java.io.File;

public class CustomBrowserControllerActivity extends AppCompatActivity {

    private static final String TAG = "CustomBrowserController";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        Intent intent = getIntent();
        String url = intent.getStringExtra("url");
        
        Log.d(TAG, "Opening URL: " + url);
        
        if (url != null && url.startsWith("file://")) {
            openFileWithFileProvider(url);
        } else {
            // For regular URLs, use the standard browser behavior
            openUrlInBrowser(url);
        }
        
        finish(); // Close this activity after opening the file/URL
    }
    
    private void openFileWithFileProvider(String fileUrl) {
        try {
            // Remove file:// prefix
            String filePath = fileUrl.substring(7);
            File file = new File(filePath);
            
            if (!file.exists()) {
                Log.e(TAG, "File does not exist: " + filePath);
                return;
            }
            
            // Generate content URI using FileProvider
            String authority = getPackageName() + ".fileprovider";
            Uri contentUri = FileProvider.getUriForFile(this, authority, file);
            
            // Determine MIME type
            String mimeType = getMimeType(filePath);
            
            // Create intent to open the file
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(contentUri, mimeType);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            
            if (intent.resolveActivity(getPackageManager()) != null) {
                startActivity(intent);
            } else {
                Log.e(TAG, "No app found to open this file type: " + mimeType);
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error opening file: " + e.getMessage(), e);
        }
    }
    
    private void openUrlInBrowser(String url) {
        try {
            if (url == null || url.isEmpty()) {
                Log.e(TAG, "URL is null or empty");
                return;
            }
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
        } catch (Exception e) {
            Log.e(TAG, "Error opening URL: " + e.getMessage(), e);
        }
    }
    
    private String getMimeType(String filePath) {
        String extension = "";
        int lastDot = filePath.lastIndexOf('.');
        if (lastDot > 0) {
            extension = filePath.substring(lastDot + 1).toLowerCase();
        }
        
        switch (extension) {
            case "pdf":
                return "application/pdf";
            case "png":
                return "image/png";
            case "jpg":
            case "jpeg":
                return "image/jpeg";
            case "gif":
                return "image/gif";
            case "txt":
                return "text/plain";
            case "doc":
                return "application/msword";
            case "docx":
                return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            default:
                return "*/*";
        }
    }
}
