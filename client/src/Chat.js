import React, { useEffect, useState } from "react";
import ScrollToBottom from "react-scroll-to-bottom";
import { AES, enc } from 'crypto-js';

function Chat({ socket, username, room }) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const iv = "initial-vector"; //store in ENV file
  const key = "secret-key" //store in ENV file

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

      setMessageList((list) => [...list, messageData]);
      
      let cipherMessage = Encrypt(currentMessage);

    const encryptedMessageData = {
      ...messageData, 
      message: cipherMessage,
    };
      await socket.emit("send_message", encryptedMessageData);
      setCurrentMessage("");
    }
  };

  const Encrypt = (message) => {
    return AES.encrypt(message, key, { iv: iv }).toString();
  }

  const Decrypt = (message) => {
    return AES.decrypt(message, key, {iv: iv}).toString(enc.Utf8);
  }

  useEffect(() => {
    socket.on("receive_message", (data) => {
      
      let decryptedMessage = Decrypt(data.message)
      const decryptedMessageData = {
        ...data, 
        message: decryptedMessage,
      };
      setMessageList((list) => [...list, decryptedMessageData]);
    });
  }, [socket]);

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
