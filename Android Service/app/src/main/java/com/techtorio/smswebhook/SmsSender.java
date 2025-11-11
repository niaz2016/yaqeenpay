package com.techtorio.smswebhook;

import android.app.PendingIntent;
import android.content.Context;
import android.telephony.SmsManager;
import android.telephony.SubscriptionManager;

public class SmsSender {
    public static boolean send(Context context, String to, String message, Integer simSlot) {
        try {
            SmsManager smsManager;
            if (simSlot != null) {
                int subId = getSubscriptionIdForSlot(context, simSlot);
                if (subId != SubscriptionManager.INVALID_SUBSCRIPTION_ID) {
                    smsManager = SmsManager.getSmsManagerForSubscriptionId(subId);
                } else {
                    smsManager = SmsManager.getDefault();
                }
            } else {
                smsManager = SmsManager.getDefault();
            }
            PendingIntent sentPI = null;
            PendingIntent deliveredPI = null;
            smsManager.sendTextMessage(to, null, message, sentPI, deliveredPI);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private static int getSubscriptionIdForSlot(Context context, int slotIndex) {
        try {
            SubscriptionManager sm = (SubscriptionManager) context.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE);
            if (sm == null) return SubscriptionManager.INVALID_SUBSCRIPTION_ID;
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                int[] subIds = sm.getSubscriptionIds(slotIndex);
                if (subIds != null && subIds.length > 0) return subIds[0];
            }
        } catch (Exception ignored) { }
        return SubscriptionManager.INVALID_SUBSCRIPTION_ID;
    }
}


