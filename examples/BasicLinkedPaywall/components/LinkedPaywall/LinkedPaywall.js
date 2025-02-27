import React, { useCallback } from 'react';
import {
  Modal,
  Text,
  Button,
  View,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  NativeModules,
  Linking,
    Alert,
} from 'react-native';
import theme from '../../theme';

const LinkedPaywall = (props) => {
  const {open, setOpen, data} = props;
  const {title, body} = data.paywallMetadata.marketing_content;
    const {privacy_text, tos_text, privacy_url, tos_url, clickwrap_text} = data.paywallMetadata.legal_citations;
  const {background_image_url_phone} = data.paywallMetadata.backgrounds.phone;
  const restore = () => {
    NativeModules.NamiPurchaseManagerBridge.restorePurchasesWithCompletionHandler((result) => {
	console.log('Restore Purchases State Change: ', result);
	if (result.stateDesc == "started") {
	    // Present "Restore Started" message if desired.
	} else if (result.stateDesc == "finished") {
	    console.log('ExampleApp: Nami purchases are ', result.newPurchases);
	    console.log('Purchase count is ', result.newPurchases.length);
	    if (result.newPurchases.length > 0) {
		Alert.alert(
		    'Restore Complete',
		    'Found your subscription!',
		    [{text: 'OK', onPress: () => console.log("Found Purchase Confirmed") }]
		);
	    } else {
		Alert.alert(
		    'Restore Complete',
		    'No active subscriptions found.',
		    [{text: 'OK', onPress: () => console.log("Found Purchase Confirmed")}]
		);
	    }
	} else if (result.stateDesc == "error") {
            Alert.alert(
		'Restore Failed',
		'Restore failed to complete.',
		[{text: 'OK', onPress: () => console.log("Restore Purchase Error was" + result.error)}]
            );
	}
    });
  }

  const purchase = (skuIdentifier) => {
    NativeModules.NamiPurchaseManagerBridge.buySKU(
      skuIdentifier,
      '',
      (purchased) => {
        console.log('ExampleApp: Nami purchase results was', purchased);
        if (purchased) {
          Alert.alert(
            'Purchase Complete',
            'Your Subscription was successfull!',
            [{text: 'OK', onPress: () => setOpen(!open)}],
            {cancelable: false},
          );
        } else {
          Alert.alert(
            'Purchase Failed',
            'Your Subscription fail!',
            [{text: 'OK', onPress: () => setOpen(!open)}],
            {cancelable: false},
          );
        }
      },
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={open}
      presentationStyle="formSheet"
      onRequestClose={() => {
        Alert.alert('LinkedPaywall has been closed.');
      }}>
      <ImageBackground
        source={{uri: data.paywallMetadata.backgrounds.phone}}
        style={{width: '100%', height: '100%'}}>
        <View style={styles.sectionContainer}>
          <TouchableOpacity onPress={() => setOpen(!open)} underlayColor="#fff">
            <Text style={styles.close}>Close</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionDescription}>{body}</Text>
        </View>
        {data.namiSkus && !!data.namiSkus.length && (
          <View style={styles.subscriptions}>
            <View style={styles.sectionContainer}>
              {data.namiSkus.map((sku, index) => {
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.subscriptionButton}
                    onPress={() => purchase(sku.skuIdentifier)}
                    underlayColor="#fff">
                    <Text style={styles.subscriptionText}>
                      {sku.localizedTitle} - {sku.localizedPrice}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <Button
                style={styles.restoreButton}
                onPress={() => restore()}
                underlayColor="#f00"
                title="Restore"
		/>

		<View style={styles.container}>
  <Text>
                  By purchasing, you agree to our{' '}
                  <Text style={styles.textStyle} onPress={() => Linking.openURL(tos_url)}>
                   {tos_text}
                  </Text>
                   {' '}and{' '}
                  <Text style={styles.textStyle} onPress={() => Linking.openURL(privacy_url)}>
                    {privacy_text}
            </Text>
		.
                </Text>
              </View>
            </View>
          </View>
        )}
      </ImageBackground>
    </Modal>
  );
};

const styles = StyleSheet.create({
  subscriptions: {
    backgroundColor: theme.white,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 340,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sectionContainer: {
    marginTop: 32,
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: theme.white,
    textAlign: 'center',
    marginBottom: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10,
  },

  sectionDescription: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: '500',
    color: theme.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10,
  },
  close: {
    color: theme.white,
    textAlign: 'right',
  },

  subscriptionButton: {
    marginRight: 40,
    marginLeft: 40,
    marginTop: 10,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: theme.black,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.white,
  },

  restoreButton: {
    marginRight: 40,
    marginLeft: 40,
    marginTop: 10,
    paddingTop: 10,
    paddingBottom: 10,
    color: theme.red,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.white,
  },

  subscriptionText: {
    color: theme.white,
    textAlign: 'center',
    paddingLeft: 10,
    paddingRight: 10,
    fontWeight: '600',
  },

  textStyle: {
    color: "blue"
  }
});

export default LinkedPaywall;
