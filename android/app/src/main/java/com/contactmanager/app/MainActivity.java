package com.contactmanager.app;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

import java.util.List;

public class MainActivity extends BridgeActivity {
    
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Log registration for debugging
        android.util.Log.d("MainActivity", "Registering custom plugins...");
        
        // Register plugins after onCreate
        registerPlugin(FileOpenerPlugin.class);
        android.util.Log.d("MainActivity", "FileOpenerPlugin registered");
        
        registerPlugin(SafeBrowserPlugin.class);
        android.util.Log.d("MainActivity", "SafeBrowserPlugin registered");
        
        registerPlugin(CustomBrowserPlugin.class);
        android.util.Log.d("MainActivity", "CustomBrowserPlugin registered");
    }
}
