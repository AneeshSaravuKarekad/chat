import React from "react";
import { StyleSheet, TouchableOpacity, View, Text } from "react-native";
import PropTypes from "prop-types";
import * as Permissions from "expo-permissions";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

// Import local modules
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
            return this.pickImage();
          case 1:
            return this.clickPicture();
          case 2:
            return this.geoLocation();
          default:
        }
      }
    );
  };

  /**
   * A method to ask the user for permission to access the camera and select the image the user wants to upload.
   * @method pickImage
   * @returns {Promise<void>} A Promise that resolves when the user has selected an image.
   */
  pickImage = async () => {
    // Ask user for permission to access photo library
    const { status } = await Permissions.askAsync(Permissions.MEDIA_LIBRARY);

    try {
      // If permission is granted, let user choose a picture
      if (status === "granted") {
        let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
        }).catch((error) => console.log(error));

        // If the user doesn't cancel process, upload image to Firebase and the fetch the image Url
        if (!result.cancelled) {
          const blob = await this.createBlob(result.uri);
          const imageUrl = await this.uploadImageFetch(blob);
          this.props.onSend({ image: imageUrl });
        }
      }
    } catch (err) {
      console.log(err.message);
    }
  };

  /**
   * A method to click the camera and upload the image.
   * @method clickPicture
   * @returns {Promise<void>} A Promise that resolves when the user clicks and sends the photo
   */
  clickPicture = async () => {
    const { status } = await Permissions.askAsync(
      Permissions.CAMERA,
      Permissions.MEDIA_LIBRARY
    );

    try {
      if (status === "granted") {
        let result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
        });

        if (!result.cancelled) {
          const blob = await this.createBlob(result.uri);
          const imageUrl = await this.uploadImageFetch(blob);
          this.props.onSend({ image: imageUrl });
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  /**
   * A method to ask the user for permission to access the location and upload the location the user wants to upload.
   * @method geoLocation
   * @returns {Promise<void>} A Promise that resolves when the user has selected thier location.
   */
  geoLocation = async () => {
    const { status } = await Permissions.askAsync(
      Permissions.LOCATION_FOREGROUND
    );

    try {
      if (status === "granted") {
        let result = await Location.getCurrentPositionAsync({});

        if (result) {
          this.props.onSend({
            location: {
              latitude: result.coords.latitude,
              longitude: result.coords.longitude,
            },
          });
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  /**
   * A method to create a blob from the image the user has selected.
   * @method createBlob
   * @param {string} uri
   * @returns {Object} An object containing the image blob and the image name
   */
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

  /**
   * A method to upload the image to Firebase and fetch the image Url.
   * @method uploadImageFetch
   * @param {Object} file contains the blob and the name of the image
   * @returns {string} downloadUrl of the image
   */
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
