import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  LogBox,
  Platform,
  Animated,
  Dimensions,
  Keyboard,
  TextInput,
  ImageBackground,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import {
  Bubble,
  GiftedChat,
  InputToolbar,
  Send,
} from "react-native-gifted-chat";
import { IconButton } from "react-native-paper";

// Firestore
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

// Import modules
import { db } from "../config/firebase";
import useAuth from "../utils/AuthProvider";
import CustomActions from "../utils/CustomActions";

// Header and keyboard layout
import { useHeaderHeight } from "@react-navigation/elements";
import { useKeyboard } from "@react-native-community/hooks";

LogBox.ignoreLogs(["EventEmitter"]);

// FIXME: This is a temporary fix for the issue with the keyboard not showing up
function KeyboardShift(props) {
  const [shift, setShift] = useState(new Animated.Value(0));
  const keyboard = useKeyboard();

  // On mount, add keyboard show and hide listeners
  // On unmount, remove them
  useEffect(() => {
    Keyboard.addListener("keyboardDidShow", handleKeyboardDidShow);
    Keyboard.addListener("keyboardDidHide", handleKeyboardDidHide);
    return () => {
      Keyboard.removeAllListeners("keyboardDidShow");
      Keyboard.removeAllListeners("keyboardDidHide");
    };
  }, []);

  const handleKeyboardDidShow = () => {
    const { height: windowHeight } = Dimensions.get("window");
    const keyboardHeight = keyboard.keyboardHeight;
    const currentlyFocusedInputRef = TextInput.State.currentlyFocusedInput();
    currentlyFocusedInputRef.measure((x, y, width, height, pageX, pageY) => {
      const fieldHeight = height;
      const fieldTop = pageY;
      const gap = windowHeight - keyboardHeight - (fieldTop + fieldHeight);
      if (gap >= 0) {
        return;
      }
      Animated.timing(shift, {
        toValue: gap,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleKeyboardDidHide = () => {
    Animated.timing(shift, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  };

  const { children } = props;

  // Android: we need an animated view since the keyboard style can vary widely
  // And React Native's KeyboardAvoidingView isn't always reliable
  if (Platform.OS === "android") {
    return (
      <Animated.View
        style={[styles.container, { transform: [{ translateY: shift }] }]}
      >
        {children}
      </Animated.View>
    );
  }
  // iOS: React Native's KeyboardAvoidingView with header offset and
  // behavior 'padding' works fine on all ios devices (and keyboard types)
  const headerHeight = useHeaderHeight();
  return (
    <KeyboardAvoidingView
      keyboardVerticalOffset={headerHeight}
      style={styles.container}
      behavior={"padding"}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

export default function Chat(props) {
  const { name, theme } = props.route.params;
  const [messages, setMessages] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const messagesCollection = collection(db, "messages");

  const { uid } = useAuth();

  /**
   * @useEffect
   * If the user is online, get messages from the database, if the user is offline, get the messages from native storage
   */
  useEffect(() => {
    // Set the name of the user as title of the screen
    props.navigation.setOptions({ headerStyle: { backgroundColor: theme } });
    props.navigation.setOptions({ title: name });
    props.navigation.setParams({
      headerStyle: {
        backgroundColor: "red",
      },
    });

    let unsubscribe;

    NetInfo.fetch().then((connection) => {
      if (connection.isConnected) {
        setIsOnline(true);
      } else {
        setIsOnline(false);
      }
    });

    // If internet is connected
    if (isOnline) {
      const messagesQuery = query(
        messagesCollection,
        orderBy("createdAt", "desc")
      );

      unsubscribe = onSnapshot(messagesQuery, updateCollection);
      addMessagesToStorage();

      return () => unsubscribe();
    } else {
      // If internet is not connected
      getMessagesFromStorage();
    }
  }, []);

  /**
   * A method to add messages to the database from native storage
   * @method getMessagesFromStorage
   * @async
   *
   */
  const getMessagesFromStorage = async () => {
    try {
      const storedMessages = await AsyncStorage.getItem("messages");
      setMessages(JSON.parse(storedMessages));
    } catch (error) {
      console.log(error.message);
    }
  };

  /**
   * A method to add the new messages to native storage
   * @method addMessagesToStorage
   * @async
   */
  const addMessagesToStorage = async () => {
    try {
      await AsyncStorage.setItem("messages", JSON.stringify(messages));
    } catch (error) {
      console.log(error.message);
    }
  };

  /**
   * A method to add messages to the firestore database
   * @method addMessage
   * @param {object} message
   */
  const addMessage = async (message) => {
    const { _id, createdAt, text, user, image } = message;

    await addDoc(messagesCollection, {
      uid,
      _id,
      createdAt,
      text: text || null,
      user,
      image: image || null,
    });
  };

  /**
   * A method to set messages state and pass the new messages to functions to add them to native storage and firestore
   *@method handleSend
   *@param {Array<Object>} messages
   */
  const handleSend = (messages = []) => {
    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, messages[0])
    );
    addMessage(messages[0]);
    addMessagesToStorage(messages);
  };

  /**
   * A method to update the messages state on query change
   * @method updateCollection
   * @param {} querySnapshot
   */
  const updateCollection = (querySnapshot) => {
    // go through each document
    setMessages(
      querySnapshot.docs.map((doc) => ({
        // get the QueryDocumentSnapshot's data
        image: doc.data().image || null,
        uid,
        _id: doc.data()._id,
        text: doc.data().text,
        createdAt: doc.data().createdAt.toDate(),
        user: doc.data().user,
      }))
    );
  };

  const renderBubble = (props) => {
    return (
      <Bubble {...props} wrapperStyle={{ right: { backgroundColor: theme } }} />
    );
  };

  function renderSend(props) {
    return (
      <Send {...props}>
        <View style={styles.sendingContainer}>
          <IconButton
            style={styles.button}
            icon="send-circle"
            size={50}
            color={theme}
          />
        </View>
      </Send>
    );
  }

  const renderInputToolBar = (props) => {
    if (isOnline) {
      return <InputToolbar {...props} containerStyle={styles.inputToolbar} />;
    } else {
      return null;
    }
  };

  const renderActions = (props) => {
    return <CustomActions {...props} propsnavigation={props.navigation} />;
  };

  return (
    <View
      style={
        theme !== "#090C08" && theme !== "#474056"
          ? [{ backgroundColor: theme }, styles.container]
          : [{ backgroundColor: theme }, styles.container]
      }
    >
      <ImageBackground
        style={styles.image}
        source={require("../assets/chatBackground.png")}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "annroid" && "padding"}
        >
          <GiftedChat
            messages={messages}
            onSend={(newMessage) => handleSend(newMessage)}
            renderBubble={renderBubble}
            renderInputToolbar={renderInputToolBar}
            renderSend={renderSend}
            placeholder="Type your message here..."
            alwaysShowSend
            scrollToBottom
            isAnimated
            renderActions={renderActions}
            user={{
              _id: uid,
              name: name,
              avatar: "https://placeimg.com/140/140/any",
            }}
          />
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  image: {
    flex: 1,
  },
  sendingContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  inputToolbar: {
    borderRadius: 20,
    marginLeft: 15,
    marginRight: 15,
    paddingVertical: 2,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    marginLeft: "auto",
  },
});
