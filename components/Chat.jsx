import { View, StyleSheet, KeyboardAvoidingView, LogBox } from "react-native";
import React, { useEffect, useState } from "react";
import { Bubble, GiftedChat } from "react-native-gifted-chat";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../config/firebase";

LogBox.ignoreLogs(["EventEmitter.removeListener"]);

export default function Chat(props) {
  const { name, theme } = props.route.params;
  const [messages, setMessages] = useState([]);
  const messagesCollection = collection(db, "messages");

  useEffect(() => {
    // Set the name of the user as title of the screen
    props.navigation.setOptions({ title: name });
    let unsubscribe;
    // Fetch messages from the database

    const messagesQuery = query(
      messagesCollection,
      orderBy("createdAt", "desc")
    );

    unsubscribe = onSnapshot(messagesQuery, updateCollection);

    return () => unsubscribe();
  }, []);

  const addMessage = (message) => {
    const { _id, createdAt, text, user } = message;
    addDoc(messagesCollection, {
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
  };

  const updateCollection = (querySnapshot) => {
    // go through each document
    setMessages(
      querySnapshot.docs.map((doc) => ({
        // get the QueryDocumentSnapshot's data

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
        onSend={(newMessage) => handleSend(newMessage)}
        user={{
          _id: 1,
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
});
