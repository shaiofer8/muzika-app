/*
 * MainActivity — native WebView shell that replaces the previous Trusted Web
 * Activity (TWA). Loads the site directly inside the app's own WebView
 * instead of delegating rendering to Chrome via Custom Tabs, so Play
 * Console counts in-app engagement correctly.
 */
package com.muzikaparty.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Message;
import android.view.KeyEvent;
import android.view.ViewGroup;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdView;

public class MainActivity extends Activity {

    private WebView webView;
    private AdView mAdView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Create container with AdView at the bottom
        FrameLayout container = new FrameLayout(this);
        container.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        // WebView takes most of the space
        webView = new WebView(this);
        FrameLayout.LayoutParams webViewParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
        webView.setLayoutParams(webViewParams);
        container.addView(webView);

        // AdView at the bottom
        mAdView = new AdView(this);
        mAdView.setAdUnitId("ca-app-pub-4066391446449273/6123655216");
        FrameLayout.LayoutParams adParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 50);
        adParams.gravity = android.view.Gravity.BOTTOM;
        mAdView.setLayoutParams(adParams);
        container.addView(mAdView);

        setContentView(container);

        // Load an ad
        AdRequest adRequest = new AdRequest.Builder().build();
        mAdView.loadAd(adRequest);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setSupportMultipleWindows(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMediaPlaybackRequiresUserGesture(false);

        final String ownHost = getString(R.string.hostName);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (request.isForMainFrame() && !ownHost.equalsIgnoreCase(uri.getHost())) {
                    openExternally(uri);
                    return true;
                }
                return false;
            }
        });

        // Links that open with target="_blank" (WhatsApp contact button, the
        // YouTube fallback link, and share.js's wa.me fallback) come through
        // here instead of shouldOverrideUrlLoading, since they're new-window
        // requests rather than in-place navigation.
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onCreateWindow(WebView view, boolean isDialog,
                                           boolean isUserGesture, Message resultMsg) {
                WebView.HitTestResult hit = view.getHitTestResult();
                String targetUrl = hit != null ? hit.getExtra() : null;

                if (targetUrl != null) {
                    openExternally(Uri.parse(targetUrl));
                    return false;
                }

                // window.open() called from script (no direct anchor tap to
                // read from HitTestResult) — capture the URL via a throwaway
                // WebView acting as the new window's transport target.
                WebView offscreen = new WebView(MainActivity.this);
                offscreen.setWebViewClient(new WebViewClient() {
                    @Override
                    public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest request) {
                        openExternally(request.getUrl());
                        return true;
                    }
                });
                WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                transport.setWebView(offscreen);
                resultMsg.sendToTarget();
                return true;
            }
        });

        webView.loadUrl(getString(R.string.launchUrl));
    }

    private void openExternally(Uri uri) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (android.content.ActivityNotFoundException e) {
            // No app can handle this URI (rare) — nothing sensible to do.
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    protected void onDestroy() {
        webView.destroy();
        super.onDestroy();
    }
}
