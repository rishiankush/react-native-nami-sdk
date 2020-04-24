//
//  NamiEntitlementManagerBridge.m
//  RNNami
//
//  Created by Kendall Gelner on 4/8/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <Nami/Nami.h>
#import "NamiBridgeUtil.h"

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

#import "React/RCTViewManager.h"




@interface NamiEntitlementManagerBridge : NSObject <RCTBridgeModule>
@end
@implementation NamiEntitlementManagerBridge (RCTExternModule)


RCT_EXPORT_METHOD(isEntitlementActive:(nonnull NSString*)entitlementRefID completion:(RCTResponseSenderBlock)completion)
{
    BOOL active = [NamiEntitlementManager isEntitlementActive:entitlementRefID];
    completion(@[[NSNumber numberWithBool:active]]);
}


RCT_EXPORT_METHOD(getEntitlements:(RCTResponseSenderBlock)completion)
{
    NSArray<NamiEntitlement *> *entitlements = [NamiEntitlementManager getEntitlements];
    
    NSMutableArray *entitlementDicts = [NSMutableArray new];
       
       for (NamiEntitlement *entitlement in entitlements) {
           NSDictionary *entitlementDict = [NamiBridgeUtil entitlementToEntitlementDict:entitlement];
           if ([entitlementDict count] > 0) {
               [entitlementDicts addObject:entitlementDict];
           }
       }
       
       completion(entitlementDicts);
}


RCT_EXPORT_METHOD(activeEntitlements:(RCTResponseSenderBlock)completion)
{
    NSArray<NamiEntitlement *> *entitlements = [NamiEntitlementManager activeEntitlements];
    
    NSMutableArray *entitlementDicts = [NSMutableArray new];
    
    for (NamiEntitlement *entitlement in entitlements) {
        NSDictionary *entitlementDict = [NamiBridgeUtil entitlementToEntitlementDict:entitlement];
        if ([entitlementDict count] > 0) {
            [entitlementDicts addObject:entitlementDict];
        }
    }
    
    completion(entitlementDicts);
}

RCT_EXPORT_METHOD(setEntitlements:(NSArray *)entitlementSetterDicts)
{

    NSMutableArray<NamiEntitlementSetter *> *entitlementSetters = [NSMutableArray array];

    for (NSDictionary *entitlementSetterDict in entitlementSetterDicts) {
        NSString *referenceID = entitlementSetterDict[@"referenceID"];
        if (referenceID != NULL && [referenceID length] > 0) {
            NSString *purchasedSKUid = entitlementSetterDict[@"purchasedSKUid"];
            NSString *expiresStr = entitlementSetterDict[@"expires"];
            // TODO: figure out reverse parsing of date string passed in
            NSDate* expires = NULL;
            
            NSString *platormStr = entitlementSetterDict[@"platform"];
            
            NamiPlatformType platform = NamiPlatformTypeOther;
            if ([platormStr isEqualToString:@"android"]) {
                platform = NamiPlatformTypeAndroid;
            } else if ([platormStr isEqualToString:@"apple"]) {
                platform = NamiPlatformTypeApple;
            } else if ([platormStr isEqualToString:@"roku"]) {
                platform = NamiPlatformTypeRoku;
            } else if ([platormStr isEqualToString:@"web"]) {
                platform = NamiPlatformTypeWeb;
            }
            
            NamiEntitlementSetter *setter = [NamiEntitlementSetter alloc];
            setter = [setter initWithId:referenceID platform:platform purchasedSKUid:purchasedSKUid expires:expires];
            
            [entitlementSetters addObject:setter];
        }
    }
    
    [NamiEntitlementManager setEntitlements:entitlementSetters];
}


@end


@implementation NamiEntitlementManagerBridge
RCT_EXPORT_MODULE_NO_LOAD(NamiEntitlementManagerBridge, NamiEntitlementManagerBridge)

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

+ (BOOL)requiresMainQueueSetup {
  return YES;
}
@end
