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
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.LinearLayout;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import android.webkit.JavascriptInterface;

public class MainActivity extends Activity {

    private WebView webView;
    private AdView mAdView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Vertical stack: WebView takes the remaining height, AdView sits below it.
        // Overlaying the ad on the WebView hid the bottom buttons from touch input.
        LinearLayout container = new LinearLayout(this);
        container.setOrientation(LinearLayout.VERTICAL);
        container.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        webView = new WebView(this);
        container.addView(webView, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        // The banner stays hidden until the score popup asks for it (see AdBridge).
        mAdView = new AdView(this);
        mAdView.setAdUnitId("ca-app-pub-4066391446449273/6123655216");
        mAdView.setAdSize(AdSize.BANNER);
        mAdView.setVisibility(View.GONE);
        container.addView(mAdView, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        setContentView(container);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setSupportMultipleWindows(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMediaPlaybackRequiresUserGesture(false);

        webView.addJavascriptInterface(new AdBridge(), "MuzikaAds");

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

    // Called from score.js: the banner is shown only while the score popup is open.
    private class AdBridge {
        @JavascriptInterface
        public void show() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if (mAdView.getVisibility() == View.VISIBLE) return;
                    mAdView.setVisibility(View.VISIBLE);
                    mAdView.loadAd(new AdRequest.Builder().build());
                }
            });
        }

        @JavascriptInterface
        public void hide() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    mAdView.setVisibility(View.GONE);
                }
            });
        }
    }
}
