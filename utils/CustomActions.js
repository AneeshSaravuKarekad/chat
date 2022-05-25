import React from "react";
import { StyleSheet, TouchableOpacity, View, Text } from "react-native";
import PropTypes from "prop-types";
import * as Permissions from "expo-permissions";
import * as ImagePicker from "expo-image-picker";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebase";

export default class CustomActions extends React.Component {
  onActionPress = () => {
    const options = [
      "Choose From Library",
      "Take Picture",
      " Send Location",
      "Cancel",
    ];
    const cancelButtonIndex = options.length - 1;
    this.context.actionSheet().showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
      },
      async (buttonIndex) => {
        switch (buttonIndex) {
          case 0:
            console.log("pick an image");
            return this.pickImage();
          case 1:
            console.log("take picture");
            return this.takePhoto();
          case 2:
            console.log("send location");
            return this.getLocation();
          default:
        }
      }
    );
  };

  pickImage = async () => {
    // Ask user for permission to access photo library
    const { status } = await Permissions.askAsync(Permissions.MEDIA_LIBRARY);

    try {
      // If permission is granted, let user choose a picture
      if (status === "granted") {
        let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: "Images",
        }).catch((error) => console.log(error));

        // If the user doesn't cancel process, upload image to Firebase and the fetch the image Url
        if (!result.cancelled) {
          const blob = await this.createBlob(result.uri);
          const imageUrl = await this.uploadImageFetch(blob);
          console.log("I'm adding this URL to the message!: " + imageUrl);
          this.props.onSend({ image: imageUrl });
          console.log("I'm already sending this message! ");
        }
      }
    } catch (err) {
      console.log(err.message);
    }
  };

  createBlob = async (uri) => {
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response);
      };
      xhr.onerror = function (e) {
        console.log(e);
        reject(new TypeError("Network request failed"));
      };
      xhr.responseType = "blob";
      xhr.open("GET", uri, true);
      xhr.send(null);
    });

    const imageNameBefore = uri.split("/");
    const imageName = imageNameBefore[imageNameBefore.length - 1];

    const file = {
      name: imageName,
      blob: blob,
    };
    console.log("Successfully converted file to blob");
    return file;
  };

  uploadImageFetch = async (file) => {
    // Creating a reference to the images folder in Firebase Cloud Storage
    const imageRef = ref(storage, "images/" + file.name);

    // Uploading the passed blob to Firebase Cloud Storage
    await uploadBytes(imageRef, file.blob);
    console.log("Uploading finished!");

    // Retrieveing the download url from the uploaded blob
    const downloadURL = await getDownloadURL(imageRef);

    return downloadURL;
  };

  render() {
    return (
      <TouchableOpacity
        accessible={true}
        accessibilityLabel="More options"
        accessibilityHint="Lets you choose to send an image or your geolocation."
        style={styles.container}
        onPress={this.onActionPress}
      >
        <View style={[styles.wrapper, this.props.wrapperStyle]}>
          <Text style={[styles.iconText, this.props.iconTextStyle]}>+</Text>
        </View>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    width: 26,
    height: 26,
    marginLeft: 10,
    marginBottom: 10,
  },
  wrapper: {
    borderRadius: 13,
    borderColor: "#b2b2b2",
    borderWidth: 2,
    flex: 1,
  },
  iconText: {
    color: "#b2b2b2",
    fontWeight: "bold",
    fontSize: 16,
    backgroundColor: "transparent",
    textAlign: "center",
  },
});

CustomActions.contextTypes = {
  actionSheet: PropTypes.func,
};
