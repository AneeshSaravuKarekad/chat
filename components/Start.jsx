import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
} from "react-native";

// Import assets
import Icon from "react-native-vector-icons/AntDesign";
import BackgroundImage from "../assets/BackgroundImage.png";

const COLORS = {
  black: "#090C08",
  gray: "#474056",
  blueishGray: "#8A95A5",
  lightGreen: "#B9C6AE",
};

const Start = (props) => {
  const [activeColor, setActiveColor] = useState(COLORS.black);
  const [name, setName] = useState("");
  const handleButtonPress = () => {
    props.navigation.navigate("Chat", { name: name, theme: activeColor });
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={BackgroundImage}
        resizeMode="cover"
        style={styles.image}
      >
        <View style={styles.topBox}>
          <Text style={styles.title}>Chat App</Text>
        </View>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 0.44 }}
        >
          <View style={styles.bottomBox}>
            <View style={styles.searchSection}>
              <Icon
                name="user"
                size={20}
                color="#000"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Your Name"
                onChangeText={(searchString) => {
                  setName(searchString);
                }}
                value={name}
                underlineColorAndroid="transparent"
              />
            </View>

            <View style={styles.selectSection}>
              <Text style={styles.selectText}>Choose Background Color:</Text>

              <View style={styles.colorContainer}>
                <View
                  style={
                    activeColor === COLORS.black
                      ? [styles.circleContainer, { borderColor: "#090C08" }]
                      : [styles.circleContainer, { borderColor: "white" }]
                  }
                >
                  <Pressable
                    onPress={() => setActiveColor(COLORS.black)}
                    style={[styles.circle, { backgroundColor: "#090C08" }]}
                  />
                </View>
                <View
                  style={
                    activeColor === COLORS.gray
                      ? [styles.circleContainer, { borderColor: "#474056" }]
                      : [styles.circleContainer, { borderColor: "white" }]
                  }
                >
                  <Pressable
                    onPress={() => setActiveColor(COLORS.gray)}
                    style={[styles.circle, { backgroundColor: "#474056" }]}
                  />
                </View>

                <View
                  style={
                    activeColor === COLORS.blueishGray
                      ? [styles.circleContainer, { borderColor: "#8A95A5" }]
                      : [styles.circleContainer, { borderColor: "white" }]
                  }
                >
                  <Pressable
                    onPress={() => setActiveColor(COLORS.blueishGray)}
                    style={[styles.circle, { backgroundColor: "#8A95A5" }]}
                  />
                </View>

                <View
                  style={
                    activeColor === COLORS.lightGreen
                      ? [styles.circleContainer, { borderColor: "#B9C6AE" }]
                      : [styles.circleContainer, { borderColor: "white" }]
                  }
                >
                  <Pressable
                    onPress={() => setActiveColor(COLORS.lightGreen)}
                    style={[styles.circle, { backgroundColor: "#B9C6AE" }]}
                  />
                </View>
              </View>
            </View>

            <Pressable
              accessible={true}
              accessibilityLabel="Navigate to Chat Screen"
              style={({ pressed }) => [
                {
                  backgroundColor: pressed ? "#585563" : "black",
                },
                styles.button,
              ]}
              onPress={handleButtonPress}
            >
              <Text style={styles.buttonText}>Start Chat</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
};

export default Start;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  image: {
    flex: 1,
    justifyContent: "center",
    padding: "5%",
  },

  title: {
    fontSize: 45,
    fontWeight: "600",
    color: "#fff",
    paddingTop: "10%",
  },

  topBox: {
    flex: 0.54,
    alignItems: "center",
  },

  bottomBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: "5%",
  },

  searchSection: {
    flexDirection: "row",
    width: "88%",
    alignItems: "center",
    borderRadius: 10,
    borderColor: "#757083",
    borderWidth: 2,
    opacity: 0.5,
  },

  searchIcon: {
    color: "#000",
    padding: 10,
  },

  input: {
    color: "#757083",
    padding: 10,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    width: "88%",
    fontSize: 16,
    fontWeight: "300",
  },

  selectSection: {
    width: "88%",
  },

  selectText: {
    fontSize: 16,
    fontWeight: "300",
    color: "#757083",
    opacity: 1,
    marginBottom: "5%",
  },

  circleContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "red",
    alignItems: "center",
    justifyContent: "center",
  },

  colorContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  button: {
    height: 50,
    width: "88%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#757083",
    borderRadius: 10,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
