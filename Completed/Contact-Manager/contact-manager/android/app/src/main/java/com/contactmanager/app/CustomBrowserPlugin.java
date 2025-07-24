package com.contactmanager.app;

import android.content.Intent;
import android.net.Uri;
import android.util.Log;
import androidx.browser.customtabs.CustomTabsIntent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "Browser")
public class CustomBrowserPlugin extends Plugin {

    private static final String TAG = "CustomBrowserPlugin";

    @PluginMethod
    public void open(PluginCall call) {
        String url = call.getString("url");
        String toolbarColor = call.getString("toolbarColor");
        Boolean presentationStyle = call.getBoolean("presentationStyle", false);
        
        Log.d(TAG, "Opening URL: " + url);
        
        if (url == null || url.isEmpty()) {
            call.reject("URL is required");
            return;
        }

        try {
            // Check if it's a file:// URI and handle it safely
            if (url.startsWith("file://")) {
                openFileWithCustomActivity(call, url);
            } else {
                openUrlWithCustomTabs(call, url, toolbarColor, presentationStyle);
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error opening URL: " + e.getMessage(), e);
            call.reject("Error opening URL: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void close(PluginCall call) {
        // For compatibility with standard Browser plugin
        JSObject result = new JSObject();
        result.put("success", true);
        call.resolve(result);
    }

    private void openFileWithCustomActivity(PluginCall call, String fileUrl) {
        try {
            Intent intent = new Intent(getContext(), CustomBrowserControllerActivity.class);
            intent.putExtra("url", fileUrl);
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

    private void openUrlWithCustomTabs(PluginCall call, String url, String toolbarColor, Boolean presentationStyle) {
        try {
            Uri uri = Uri.parse(url);
            
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
}
