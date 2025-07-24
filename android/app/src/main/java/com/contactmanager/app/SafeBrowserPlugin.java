package com.contactmanager.app;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.webkit.MimeTypeMap;
import android.util.Log;
import androidx.core.content.FileProvider;
import androidx.browser.customtabs.CustomTabsIntent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;

@CapacitorPlugin(name = "SafeBrowser")
public class SafeBrowserPlugin extends Plugin {

    private static final String TAG = "SafeBrowserPlugin";

    @PluginMethod
    public void open(PluginCall call) {
        String url = call.getString("url");
        String toolbarColor = call.getString("toolbarColor");
        Boolean presentationStyle = call.getBoolean("presentationStyle", false);
        
        Log.d(TAG, "Attempting to open: " + url);
        
        if (url == null || url.isEmpty()) {
            call.reject("URL is required");
            return;
        }

        try {
            // Check if it's a file:// URI
            if (url.startsWith("file://")) {
                openFile(call, url);
            } else {
                openUrl(call, url, toolbarColor, presentationStyle);
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error opening URL: " + e.getMessage(), e);
            call.reject("Error opening URL: " + e.getMessage());
        }
    }

    private void openFile(PluginCall call, String fileUri) {
        try {
            // Use our custom activity to handle file URIs safely
            Intent intent = new Intent(getContext(), CustomBrowserControllerActivity.class);
            intent.putExtra("url", fileUri);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            
            getContext().startActivity(intent);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "File opened successfully");
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Error opening file: " + e.getMessage(), e);
            call.reject("Error opening file: " + e.getMessage());
        }
    }

    private void openUrl(PluginCall call, String url, String toolbarColor, Boolean presentationStyle) {
        try {
            Uri uri = Uri.parse(url);
            
            // Use Custom Tabs for web URLs
            CustomTabsIntent.Builder builder = new CustomTabsIntent.Builder();
            
            if (toolbarColor != null && !toolbarColor.isEmpty()) {
                try {
                    int color = android.graphics.Color.parseColor(toolbarColor);
                    builder.setToolbarColor(color);
                } catch (IllegalArgumentException e) {
                    Log.w(TAG, "Invalid toolbar color: " + toolbarColor);
                }
            }
            
            CustomTabsIntent customTabsIntent = builder.build();
            customTabsIntent.launchUrl(getContext(), uri);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "URL opened successfully");
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Error opening URL: " + e.getMessage(), e);
            call.reject("Error opening URL: " + e.getMessage());
        }
    }
    
    private String getMimeType(String filePath) {
        String extension = "";
        int lastDot = filePath.lastIndexOf('.');
        if (lastDot > 0) {
            extension = filePath.substring(lastDot + 1).toLowerCase();
        }
        
        String mimeType = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);
        
        // Handle common file types explicitly
        if (mimeType == null) {
            switch (extension) {
                case "pdf":
                    mimeType = "application/pdf";
                    break;
                case "png":
                    mimeType = "image/png";
                    break;
                case "jpg":
                case "jpeg":
                    mimeType = "image/jpeg";
                    break;
                case "gif":
                    mimeType = "image/gif";
                    break;
                case "txt":
                    mimeType = "text/plain";
                    break;
                case "doc":
                    mimeType = "application/msword";
                    break;
                case "docx":
                    mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                    break;
                default:
                    mimeType = "*/*";
                    break;
            }
        }
        
        return mimeType;
    }
}
