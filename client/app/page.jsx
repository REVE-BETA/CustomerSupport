"use client";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  Sidebar,
  Search,
  ConversationList,
  Conversation,
  Avatar,
  ConversationHeader,
  ToggleConversationListUsingBackButtonStory,
} from "@chatscope/chat-ui-kit-react";
import styles from "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import UserListComponent from "./right";
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import io from "socket.io-client";
var socket;
export default function Home() {
  const inputRef = useRef(null);
  const [msgInputValue, setMsgInputValue] = useState("");
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [sidebarStyle, setSidebarStyle] = useState({});
  const [chatContainerStyle, setChatContainerStyle] = useState({});
  const [conversationContentStyle, setConversationContentStyle] = useState({});
  const [conversationAvatarStyle, setConversationAvatarStyle] = useState({});
  ///////////////////////////////////
  const [chat, setChat] = useState([]);
  const [message, SetMessage] = useState([]);
  const [Message_field_active, set_Message_field_active] = useState(false);
  const [active_customer, set_active_customer] = useState("");
  const [current_chat, set_current_chat] = useState();
  const [Chat_room, Set_Chat_room] = useState()
  ///////////////////////////////////
  const token = JSON.parse(localStorage.getItem("access_token"));
  const { access_token } = token;
  /////////////////////////
  useEffect(() => {
    socket = io("http://localhost:8000/", {
      extraHeaders: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    socket.on("message", (messages) => {
      console.log(messages,"socket_msg")
      SetMessage((prevmsg)=>[...prevmsg, messages])
      console.log(messages, "socket")
      //setMessages((prevMessages) => [...prevMessages, message]);
    });
    return () => {
      socket.off("message");
    };
  }, []);
  //////////////////////////
  const handleBackClick = () => setSidebarVisible(!sidebarVisible);
  ///////////////////////
  const handleSend = async (messages) => {
   // console.log(token.payload2.id,"sendmsg")
    const formatted = {
      agentId:3,// token.payload2.id,
      customer_id: active_customer,
      content: messages,
      chatId:Chat_room,
      Agent_send: true,
      Customer_send: false,
    };

    try {
      console.log(formatted, 'formated')
      const { data } = await axios.post(
        "http://localhost:8000/message/send",
        formatted
      );

     // SetMessage([...message, data[0]]); // Append the new message to the existing messages array
      socket.emit("sendMessage", { roomId:Chat_room, message: data[0] });
    } catch (error) {
      console.error("Error:", error);
    }

    setMsgInputValue("");
    inputRef.current?.focus();
  };
  ////////////////////
  const handleConversationClick = async (agentId, customer_id, chatId) => {
    try {
      if (sidebarVisible) {
        setSidebarVisible(false);
      }
      const data = await axios.post(
        "http://localhost:8000/message/findAll_for_sender",
        {
          agentId,
          customer_id,
          chatId
        }
      );
      console.log(data,'messages getted')
      SetMessage(data.data);
      Set_Chat_room(chatId)
      socket.emit("joinRoom", chatId);

      set_active_customer(customer_id);
      await set_current_chat(chat.filter((c) => c.chatId === chatId)); // Await setting current chat
      set_Message_field_active(true);

    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };
  //////////////////////////
  useEffect(() => {
    if (sidebarVisible) {
      setSidebarStyle({
        display: "flex",
        flexBasis: "auto",
        width: "100%",
        maxWidth: "100%",
      });

      setConversationContentStyle({
        display: "flex",
      });

      setConversationAvatarStyle({
        marginRight: "1em",
      });

      setChatContainerStyle({
        display: "none",
      });
    } else {
      setSidebarStyle({});
      setConversationContentStyle({});
      setConversationAvatarStyle({});
      setChatContainerStyle({});
    }
  }, [
    sidebarVisible,
    setSidebarVisible,
    setConversationContentStyle,
    setConversationAvatarStyle,
    setSidebarStyle,
    setChatContainerStyle,
  ]);
  //////////////////////
  const getChats = async () => {
    try {
      if (!token) {
        console.warn('No token found. User ID cannot be retrieved.');
        return; // Early exit if no token
      }
  
      const response = await axios.post(
        "http://localhost:8000/chat/get",
        {
          chat_receiver: 3, // Replace with token.payload2.id if applicable
        },
        {
          headers: {
            Authorization: `Bearer ${token.access_token}`, // Include token for authentication
          },
        }
      );
  
      const chats = response.data; // Assuming response.data contains the chat array
  
      // Sort chats based on chatCreatedAt in descending order (latest first)
      const sortedChats = chats.sort((a, b) => {
        const dateA = new Date(a.chatCreatedAt);
        const dateB = new Date(b.chatCreatedAt);
        return dateB.getTime() - dateA.getTime(); // Descending order
      });
  
      // Filter resolved chats (assuming "resolved" is the value)
      const resolvedChats = sortedChats.filter((chat) => chat.chatSession === "resolved");
      const unresolvedChats = sortedChats.filter((chat) => chat.chatSession !== "resolved");
  
      // Combine chats in desired order: unresolved first, then resolved
      const combinedChats = [...unresolvedChats, ...resolvedChats];
  
      // Update chat state
      setChat(combinedChats);
    } catch (error) {
      console.error("Error fetching chat data:", error);
    }
  };
  /////////////////
  const handleBlock = async () => {
    const id = current_chat[0].chatSenderId;
    const response = await axios.patch(
      `http://localhost:8000/customers/block/${id}`
    );
    console.log(response, "blocked");
    // await set_current_chat(...current_chat ,current_chat[0].chatSender.isBlocked=true)
  };
  ////////////////////
  const handleResolve = async () => {
    const id = current_chat[0].chatId;
    console.log(current_chat[0])
    const response = await axios.patch(
      `http://localhost:8000/chat/resolved/${id}`
    );
    console.log(response.data,"resolved");
    const filt = chat.filter((e)=>e.chatId !== id)
    setChat(filt)
  };
  ///////////////////
  const handleUnBlock = async () => {
    const id = current_chat[0].chatSenderId;
    const response = await axios.patch(
      `http://localhost:8000/customers/Unblock/${id}`
    );
    console.log(response, "unblocked");
  };
  ///////////////////
  useEffect(() => {
    getChats();
  }, []);
  ///////////////////
  return (
    <main>
      <MainContainer
        responsive
        style={{
          height: "96vh",
        }}
      >
        <Sidebar position="left" style={sidebarStyle}>
          <Search placeholder="Search..." />
          <ConversationList>
            {chat &&
              chat.map((chats) => (
                <Conversation
                  onClick={() =>
                    handleConversationClick(
                      chats.chatReceiverId,
                      chats.chatSenderId,
                      chats.chatId
                    )
                  }
                >
                  <Avatar
                    src="https://chatscope.io/storybook/react/assets/lilly-aj6lnGPk.svg"
                    name={chats.chatSender.name}
                    status={
                      chats.chatSession == "in_session" ? "dnd" : "available"
                    } 
                    style={conversationAvatarStyle}
                  />
                  <Conversation.Content
                    name={chats.chatSender.name}
                    lastSenderName="Report"
                    info={chats.chatTitle}
                    style={conversationContentStyle}
                  />
                </Conversation>
              ))}
          </ConversationList>
        </Sidebar>

        <ChatContainer style={chatContainerStyle}>
          {active_customer ? (
            current_chat && (
              <ConversationHeader>
                <ConversationHeader.Back onClick={handleBackClick} />
                <ToggleConversationListUsingBackButtonStory />
                <Avatar
                  name="tati"
                  //name={current_chat.chatSender.name}
                  src="https://chatscope.io/storybook/react/assets/zoe-E7ZdmXF0.svg"
                />
                <ConversationHeader.Content
                  // info=";alksdjf;lakdjfa;ls"
                  info={current_chat[0].chatTitle}
                  userName={current_chat[0].chatSender.name}
                  // userName="Zoe"
                />
                <ConversationHeader.Actions>
                  {current_chat[0].chatSession == "in_session" ? (
                    <button
                      class="hover:bg-green-600 px-4 py-2 rounded bg-green-500 text-white font-bold"
                      onClick={() => handleResolve()}
                    >
                      Resolve
                    </button>
                  ) : (
                    <button
                      disabled={true}
                      class=" px-4 py-2 rounded bg-green-500 text-white font-bold"
                    >
                      Completed
                    </button>
                  )}
                  {current_chat[0].chatSender.isBlocked ? (
                    <button
                      class="hover:bg-red-600 px-4 py-2 ml-2 rounded bg-red-500 text-white font-bold"
                      onClick={() => handleUnBlock()}
                    >
                      UnBlock
                    </button>
                  ) : (
                    <button
                      class="hover:bg-red-600 px-4 py-2 ml-2 rounded bg-red-500 text-white font-bold"
                      onClick={() => handleBlock()}
                    >
                      Block
                    </button>
                  )}
                </ConversationHeader.Actions>
              </ConversationHeader>
            )
          ) : (
            <p></p>
          )}
          <MessageList
          // typingIndicator={<TypingIndicator content="Zoe is typing" />}
          >
            {/* <MessageSeparator content="Saturday, 30 November 2019" /> */}
            {Message_field_active ? (
              message &&
              message?.map((msg) => (
                <Message
                  key={msg.id}
                  model={{
                    direction: msg.Agent_send ? "outgoing" : "incoming",
                    message: msg.content,
                    position: "single",
                    sender: "Zoe",
                    sentTime: msg.createdAt,
                  }}
                >
                  <Avatar
                    name={msg.content}
                    src="https://chatscope.io/storybook/react/assets/zoe-E7ZdmXF0.svg"
                  />
                </Message>
              ))
            ) : (
              <MessageList.Content
                style={{
                  display: "flex",
                  flexDirection: "column",
                  fontSize: "1.2em",
                  height: "100%",
                  justifyContent: "center",
                  textAlign: "center",
                }}
              >
                No Chat selected yet
                <ConversationHeader.Back onClick={handleBackClick} />
              </MessageList.Content>
              
            )}
          </MessageList>
          {active_customer ? (
            <MessageInput
              placeholder="Type message here"
              onSend={handleSend}
              onChange={setMsgInputValue}
              value={msgInputValue}
              ref={inputRef}
            />
          ) : (
            <p></p>
          )}
        </ChatContainer>
        <Sidebar position="right">
          <UserListComponent />
        </Sidebar>
      </MainContainer>
    </main>
  );
}
