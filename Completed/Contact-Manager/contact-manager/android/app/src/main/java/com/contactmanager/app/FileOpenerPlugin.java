package com.contactmanager.app;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.webkit.MimeTypeMap;
import android.util.Log;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.util.List;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "FileOpener")
public class FileOpenerPlugin extends Plugin {

    private static final String TAG = "FileOpenerPlugin";
    private final Executor executor = Executors.newSingleThreadExecutor();

    @PluginMethod
    public void openFile(PluginCall call) {
        String filePath = call.getString("filePath");
        String mimeType = call.getString("mimeType");
        
        Log.d(TAG, "Attempting to open file: " + filePath);
        
        if (filePath == null || filePath.isEmpty()) {
            call.reject("File path is required");
            return;
        }

        // Run on background thread to avoid blocking UI
        executor.execute(() -> {
            try {
                String processedPath = filePath;
                
                // Handle file:// URIs by extracting the path
                if (processedPath.startsWith("file://")) {
                    processedPath = processedPath.substring(7); // Remove "file://" prefix
                }
                
                File file = new File(processedPath);
                Log.d(TAG, "File exists: " + file.exists() + ", Path: " + file.getAbsolutePath());
                
                if (!file.exists()) {
                    call.reject("File does not exist: " + processedPath);
                    return;
                }

                if (!file.canRead()) {
                    call.reject("File is not readable: " + processedPath);
                    return;
                }

                // Generate content URI using FileProvider
                Uri contentUri;
                try {
                    String authority = getContext().getPackageName() + ".fileprovider";
                    contentUri = FileProvider.getUriForFile(getContext(), authority, file);
                    Log.d(TAG, "Generated content URI: " + contentUri.toString());
                } catch (IllegalArgumentException e) {
                    Log.e(TAG, "File is outside configured FileProvider paths: " + e.getMessage());
                    call.reject("File is outside configured FileProvider paths. The file may be in an unsupported location.");
                    return;
                }
                
                // Determine MIME type if not provided
                String finalMimeType = mimeType;
                if (finalMimeType == null || finalMimeType.isEmpty()) {
                    finalMimeType = getMimeType(processedPath);
                }
                Log.d(TAG, "Using MIME type: " + finalMimeType);
                
                // Create intent to open the file
                Intent intent = new Intent(Intent.ACTION_VIEW);
                intent.setDataAndType(contentUri, finalMimeType);
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                
                // Check if there's an app to handle this intent
                PackageManager packageManager = getContext().getPackageManager();
                List<ResolveInfo> activities = packageManager.queryIntentActivities(intent, 0);
                
                if (activities.isEmpty()) {
                    Log.e(TAG, "No activity found to handle file type: " + finalMimeType);
                    call.reject("No app found to open this file type: " + finalMimeType);
                    return;
                }
                
                // Switch back to UI thread for starting activity
                getActivity().runOnUiThread(() -> {
                    try {
                        getContext().startActivity(intent);
                        
                        JSObject result = new JSObject();
                        result.put("success", true);
                        result.put("message", "File opened successfully");
                        result.put("contentUri", contentUri.toString());
                        call.resolve(result);
                    } catch (Exception e) {
                        Log.e(TAG, "Error starting activity: " + e.getMessage(), e);
                        call.reject("Error starting activity: " + e.getMessage());
                    }
                });
                
            } catch (Exception e) {
                Log.e(TAG, "Error opening file: " + e.getMessage(), e);
                call.reject("Error opening file: " + e.getMessage());
            }
        });
    }
    
    private String getMimeType(String filePath) {
        String extension = "";
        int lastDot = filePath.lastIndexOf('.');
        if (lastDot > 0) {
            extension = filePath.substring(lastDot + 1).toLowerCase();
        }
        
        String mimeType = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);
        return mimeType != null ? mimeType : "*/*";
    }
}
