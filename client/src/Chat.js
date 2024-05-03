import React, { useEffect, useState } from "react";
import ScrollToBottom from "react-scroll-to-bottom";
import { AES, enc, SHA256 } from "crypto-js";


function Chat({ socket, username, room }) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const iv = "initial-vector"; //store in ENV file

  const generateKey = (index) => {
    const key = "secret-key";
    return SHA256(key + index).toString();
  };

  const [key, setKey] = useState(generateKey(0));
  
  useEffect(() => {
    const intervalId = setInterval(() => {
      const newIndex = Math.floor(Date.now() / (100 * 60 * 10 )); // Change key every 2 sec
      setKey(generateKey(newIndex));
    }, 60000); // Update key every 2 sec

    return () => clearInterval(intervalId);
  }, [messageList.length]);

  const sendMessage = async () => {
    if (currentMessage !== "") {
      const messageData = {
        room: room,
        author: username,
        message: currentMessage,
        time:
          new Date(Date.now()).getHours() +
          ":" +
          new Date(Date.now()).getMinutes(),
      };

      let cipherMessage = Encrypt(currentMessage, key);

      const encryptedMessageData = {
        ...messageData,
        message: cipherMessage,
      };

      setMessageList((list) => [...list, messageData, encryptedMessageData]);
      await socket.emit("send_message", encryptedMessageData);
      setCurrentMessage("");

    }
  };

  const Encrypt = (message, key) => {
    console.log("Encrypt key", key);
    const padded = enc.Utf8.parse(message).toString(enc.Base64);
    return AES.encrypt(padded, key, { iv: iv }).toString();
  };
  
  const Decrypt = (message, key) => {
    console.log("Decrypt key", key);
    const unpadded = enc.Base64.parse(AES.decrypt(message, key, { iv: iv }).toString(enc.Utf8)).toString(enc.Utf8);
    return unpadded;
  };

  useEffect(() => {
    socket.on("receive_message", (data) => {
      let encryptedMessageData = data;
      let decryptedMessage = Decrypt(data.message, key);

        const decryptedMessageData = {
          ...data,
          message: decryptedMessage,
        };
        setMessageList((list) => [
          ...list,
          decryptedMessageData,
          encryptedMessageData,
        ]);

    });

    return () => socket.off("receive_message");
  }, [socket, key]);

  return (
    <div className="chat-window">
      <div className="chat-header">
        <p>Live Chat</p>
      </div>
      <div className="chat-body">
        <ScrollToBottom className="message-container">
          {messageList.map((messageContent, id) => {
            return (
              <div
                className="message"
                id={username === messageContent.author ? "you" : "other"}
                key={id}
              >
                <div>
                  <div className="message-content">
                    <p>{messageContent.message}</p>
                  </div>
                  <div className="message-meta">
                    <p id="time">{messageContent.time}</p>
                    <p id="author">{messageContent.author}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </ScrollToBottom>
      </div>
      <div className="chat-footer">
        <input
          type="text"
          value={currentMessage}
          placeholder="Hey..."
          onChange={(event) => {
            setCurrentMessage(event.target.value);
          }}
          onKeyDown={(event) => {
            event.key === "Enter" && sendMessage();
          }}
        />
        <button onClick={sendMessage}>&#9658;</button>
      </div>
    </div>
  );
}

export default Chat;
