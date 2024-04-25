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
export default function Home() {
  const inputRef = useRef(null);
  const [msgInputValue, setMsgInputValue] = useState("");
  // const [messages, setMessages] = useState([]);

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
  ///////////////////////////////////
  const handleBackClick = () => setSidebarVisible(!sidebarVisible);
  ///////////////////////
  const handleSend = async (messages) => {
    const formatted = {
      agentId: 3,
      customer_id: active_customer,
      content: messages,
      Agent_send: true,
      Customer_send: false,
    };

    try {
      const { data } = await axios.post(
        "http://localhost:8000/message/send",
        formatted
      );
      console.log(data[0], "message_posted");
      SetMessage([...message, data[0]]); // Append the new message to the existing messages array
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
        }
      );
      SetMessage(data.data);

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
      // const token = localStorage.getItem('access_token');

      // if (!token) {
      //   console.warn('No token found. User ID cannot be retrieved.');
      //   return; // Early exit if no token
      // }
      const response = await axios.post(
        "http://localhost:8000/chat/get",
        {
          chat_receiver: 3,
        }
        // {
        //   headers: {
        //     Authorization: `Bearer ${token}`, // Include token for authentication
        //   },
        // }
      );

      setChat(response.data);
    } catch (error) {
      console.error("Error fetching chat data:", error);
    }
  };

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
                    status="available"
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
                  {
                    (current_chat[0].chatSession = "in_session" ? (
                      <button class="hover:bg-green-600 px-4 py-2 rounded bg-green-500 text-white font-bold">
                        Resolve
                      </button>
                    ) : (
                      <button class="hover:bg-green-600 px-4 py-2 rounded bg-green-500 text-white font-bold">
                       Completed
                      </button>
                    ))
                  }
                  {current_chat[0].chatSender.isBlocked ? (
                    <button class="hover:bg-red-600 px-4 py-2 ml-2 rounded bg-red-500 text-white font-bold"
                    >
                      UnBlock
                    </button>
                  ) : (
                    <button class="hover:bg-red-600 px-4 py-2 ml-2 rounded bg-red-500 text-white font-bold">
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
