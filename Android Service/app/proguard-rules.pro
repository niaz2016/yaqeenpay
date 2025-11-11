# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.

-dontwarn org.slf4j.impl.StaticLoggerBinder

# Keep all security and cryptography providers
-keep class * extends java.security.Provider

# Keep the Bouncy Castle provider if you use it (common in Android)
-keep class org.bouncycastle.** { *; }
-dontwarn org.bouncycastle.**
