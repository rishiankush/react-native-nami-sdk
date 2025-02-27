package com.nami.reactlibrary

import android.util.Log
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.namiml.entitlement.NamiEntitlement
import com.namiml.entitlement.NamiEntitlementManager
import com.namiml.entitlement.NamiEntitlementSetter
import com.namiml.entitlement.NamiPlatformType
import java.util.ArrayList
import java.util.Date

class NamiEntitlementManagerBridgeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    init {
        NamiEntitlementManager.registerEntitlementChangeListener {
            emitEntitlementsChanged(it)
        }
    }

    private fun emitEntitlementsChanged(activeEntitlements: List<NamiEntitlement>) {
        val map: WritableMap = WritableNativeMap()

        val resultArray: WritableArray = WritableNativeArray()
        for (entitlement in activeEntitlements) {
            entitlement.toEntitlementDict()?.let { entitlementDict ->
                resultArray.pushMap(entitlementDict)
            }
        }

        map.putArray("activeEntitlements", resultArray)
        try {
            reactApplicationContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("EntitlementsChanged", map)
        } catch (e: Exception) {
            Log.e(LOG_TAG, "Caught Exception: " + e.message)
        }
    }

    override fun getName(): String {
        return "NamiEntitlementManagerBridge"
    }

    @ReactMethod
    fun isEntitlementActive(entitlementRefID: String, resultsCallback: Callback) {
        reactApplicationContext.runOnUiQueueThread {
            val isActive = NamiEntitlementManager.isEntitlementActive(entitlementRefID)

            Log.i(
                LOG_TAG,
                "Checking for $entitlementRefID entitlement active, result was $isActive"
            )
            resultsCallback.invoke(isActive)
        }
    }

    @ReactMethod
    fun activeEntitlements(resultsCallback: Callback) {

        reactApplicationContext.runOnUiQueueThread {
            val nativeEntitlements = NamiEntitlementManager.activeEntitlements()

            val resultArray: WritableArray = WritableNativeArray()
            for (entitlement in nativeEntitlements) {
                entitlement.toEntitlementDict()?.let { entitlementDict ->
                    resultArray.pushMap(entitlementDict)
                }
            }
            resultsCallback.invoke(resultArray)
        }
    }

    @ReactMethod
    fun getEntitlements(resultsCallback: Callback) {

        reactApplicationContext.runOnUiQueueThread {
            val nativeEntitlements = NamiEntitlementManager.getEntitlements()

            Log.i(LOG_TAG, "getEntitlements result is $nativeEntitlements")

            val resultArray: WritableArray = WritableNativeArray()
            for (entitlement in nativeEntitlements) {
                entitlement.toEntitlementDict()?.let { entitlementDict ->
                    resultArray.pushMap(entitlementDict)
                }
            }
            resultsCallback.invoke(resultArray)
        }
    }

    @ReactMethod
    fun setEntitlements(entitlements: ReadableArray) {
        val entitlementsToSet = ArrayList<NamiEntitlementSetter>()

        val size = entitlements.size()
        var index = 0
        while (index < size) {
            val setterMap: ReadableMap? = entitlements.getMap(index)
            setterMap?.let {
                val entitlementSetter = entitlementSetterFromSetterMap(setterMap)
                entitlementSetter?.let {
                    entitlementsToSet.add(entitlementSetter)
                }
            }
            index += 1
        }

        reactApplicationContext.runOnUiQueueThread {
            NamiEntitlementManager.setEntitlements(entitlementsToSet)
        }
    }

    @ReactMethod
    fun clearAllEntitlements() {
        reactApplicationContext.runOnUiQueueThread {
            NamiEntitlementManager.clearAllEntitlements()
        }
    }

    private fun entitlementSetterFromSetterMap(entitlementSetterMap: ReadableMap): NamiEntitlementSetter? {
        if (entitlementSetterMap.hasKey("referenceID")) {
            val referenceID = entitlementSetterMap.getString("referenceID").orEmpty()
            if (referenceID.isNotEmpty()) {
                val expires: Date? = null

                var purchasedSKUid: String? = null
                if (entitlementSetterMap.hasKey("purchasedSKUID")) {
                    purchasedSKUid = entitlementSetterMap.getString("purchasedSKUid")
                }

                var platform: NamiPlatformType = NamiPlatformType.OTHER
                if (entitlementSetterMap.hasKey("platform")) {
                    platform = when (entitlementSetterMap.getString("platform")) {
                        "other" -> NamiPlatformType.OTHER

                        "android" -> NamiPlatformType.ANDROID

                        "apple" -> NamiPlatformType.APPLE

                        "roku" -> NamiPlatformType.ROKU

                        "web" -> NamiPlatformType.WEB

                        else -> NamiPlatformType.OTHER
                    }
                }

                //referenceId: kotlin.String, purchasedSKUid: kotlin.String?, expires: java.util.Date?, platform: com.namiml.entitlement.NamiPlatformType
                return NamiEntitlementSetter(referenceID, platform, purchasedSKUid, expires)
            }
        }
        Log.e(LOG_TAG, "Attempted to set entitlement with no referenceID $entitlementSetterMap")

        return null
    }
}
