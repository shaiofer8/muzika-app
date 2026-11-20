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
import android.graphics.Color;
import android.view.Gravity;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.ump.ConsentInformation;
import com.google.android.ump.ConsentRequestParameters;
import com.google.android.ump.UserMessagingPlatform;
import android.webkit.JavascriptInterface;

public class MainActivity extends Activity {

    private WebView webView;
    private AdView mAdView;
    private FrameLayout adHolder;
    private ConsentInformation consentInfo;

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
        mAdView.setAdUnitId("ca-app-pub-4066391446449273/6201064269");
        mAdView.setAdSize(AdSize.BANNER);

        // targetSdk 35+ draws edge-to-edge, so the bottom of the window sits under
        // the navigation bar. The ad lives in a holder padded by that inset, so the
        // banner is fully visible with both gesture and 3-button navigation.
        adHolder = new FrameLayout(this);
        adHolder.setBackgroundColor(Color.BLACK);
        adHolder.setVisibility(View.GONE);
        adHolder.addView(mAdView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT,
                Gravity.CENTER_HORIZONTAL));
        adHolder.setOnApplyWindowInsetsListener((v, insets) -> {
            v.setPadding(0, 0, 0, insets.getSystemWindowInsetBottom());
            return insets;
        });
        container.addView(adHolder, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        setContentView(container);

        requestConsent();

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

    // EEA/UK consent (Google UMP). Ads are requested only when canRequestAds() is true.
    private void requestConsent() {
        ConsentRequestParameters params = new ConsentRequestParameters.Builder()
                .setTagForUnderAgeOfConsent(false)
                .build();
        consentInfo = UserMessagingPlatform.getConsentInformation(this);
        consentInfo.requestConsentInfoUpdate(this, params,
                () -> UserMessagingPlatform.loadAndShowConsentFormIfRequired(this, formError -> { }),
                requestError -> { });
    }

    // Called from score.js: the banner is shown only while the score popup is open.
    private class AdBridge {
        @JavascriptInterface
        public void show() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if (consentInfo == null || !consentInfo.canRequestAds()) return;
                    if (adHolder.getVisibility() == View.VISIBLE) return;
                    adHolder.setVisibility(View.VISIBLE);
                    adHolder.requestApplyInsets();
                    mAdView.loadAd(new AdRequest.Builder().build());
                }
            });
        }

        @JavascriptInterface
        public void hide() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    adHolder.setVisibility(View.GONE);
                }
            });
        }
    }
}
