import React, { useEffect, useState } from "react";
import { View, StyleSheet, KeyboardAvoidingView, LogBox } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { Bubble, GiftedChat, InputToolbar } from "react-native-gifted-chat";

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

LogBox.ignoreLogs(["EventEmitter"]);

export default function Chat(props) {
  const { name, theme } = props.route.params;
  const [messages, setMessages] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const messagesCollection = collection(db, "messages");

  const { uid } = useAuth();

  useEffect(() => {
    // Set the name of the user as title of the screen
    props.navigation.setOptions({ title: name });
    let unsubscribe;
    // Fetch messages from the database
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

      return () => unsubscribe();
    } else {
      // If internet is not connected
      getMessagesFromStorage();
    }
  }, []);

  const getMessagesFromStorage = async () => {
    try {
      const storedMessages = await AsyncStorage.getItem("messages");
      setMessages(JSON.parse(storedMessages));
    } catch (error) {
      console.log(error.message);
    }
  };

  const addMessagesToStorage = async () => {
    try {
      await AsyncStorage.setItem("messages", JSON.stringify(messages));
    } catch (error) {
      console.log(error.message);
    }
  };

  const addMessage = (message) => {
    const { _id, createdAt, text, user } = message;
    addDoc(messagesCollection, {
      uid,
      _id,
      createdAt,
      text,
      user,
    });
  };

  const handleSend = (messages = []) => {
    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, messages)
    );
    addMessage(messages[0]);
    addMessagesToStorage(messages);
  };

  const updateCollection = (querySnapshot) => {
    // go through each document
    setMessages(
      querySnapshot.docs.map((doc) => ({
        // get the QueryDocumentSnapshot's data
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
      <Bubble
        {...props}
        wrapperStyle={{ right: { backgroundColor: "green" } }}
      />
    );
  };

  const renderInputToolBar = (props) => {
    if (isOnline) {
      return <InputToolbar label="Send" {...props} />;
    } else {
      return null;
    }
  };

  return (
    <View
      style={
        theme !== "#090C08" && theme !== "#474056"
          ? [{ backgroundColor: theme }, styles.container]
          : [{ backgroundColor: theme }, styles.container]
      }
    >
      <GiftedChat
        messages={messages}
        renderBubble={renderBubble}
        forceGetKeyboardHeight={true}
        renderInputToolbar={renderInputToolBar}
        onSend={(newMessage) => handleSend(newMessage)}
        user={{
          _id: uid,
          name: name,
          avatar: "https://placeimg.com/140/140/any",
        }}
      />
      {Platform.OS === "android" && <KeyboardAvoidingView behavior="height" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sendButton: {
    width: "100%",
    height: "100%",
  },
});
