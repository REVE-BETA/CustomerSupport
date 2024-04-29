"use client";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  Avatar,
  ConversationHeader,
  Sidebar,
} from "@chatscope/chat-ui-kit-react";
import styles from "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import io from "socket.io-client";
//import UserListComponent from "./side";
//import ActiveSessions from "./side";
var socket;
export default function Home() {
  const inputRef = useRef(null);
  const [msgInputValue, setMsgInputValue] = useState("");
  const [sidebarVisible, setSidebarVisible] = useState(false);
  // const [sidebarStyle, setSidebarStyle] = useState({});
  const [chatContainerStyle, setChatContainerStyle] = useState({});
  // const [conversationContentStyle, setConversationContentStyle] = useState({});
  //const [conversationAvatarStyle, setConversationAvatarStyle] = useState({});
  ///////////////////////////////////
  const [chat, setChat] = useState([]);
  const [active_customer, set_active_customer] = useState("");
  const [message, SetMessage] = useState([]);
  const [room, set_room] = useState();
  const [Agent_id, set_Agent_id] = useState();
  const [open_chat_message, set_open_chat_message] = useState();
  const [resolvedSessions, setResolvedSessions] = useState([]);

  ///////////////////////////////////
  const token = JSON.parse(localStorage.getItem("access_token"));
  const { access_token } = token;
  let agent;
  const handleBackClick = () => setSidebarVisible(!sidebarVisible);

  // const handleConversationClick = useCallback(() => {
  //   if (sidebarVisible) {
  //     setSidebarVisible(false);
  //   }
  // }, [sidebarVisible, setSidebarVisible]);

  const handleSend = async (messages) => {
    console.log(Agent_id, "agent");
    const formatted = {
      agentId: Agent_id, // agent,
      customer_id: token.payload2.id, ///
      content: messages, ///
      Agent_send: false,
      Customer_send: true,
    };
    try {
      const { data } = await axios.post(
        "http://localhost:8000/message/send",
        formatted
      );
      console.log(data, "msg res");
      if (!data[0]) {
        setMsgInputValue("");
        inputRef.current?.focus();
        return;
      }
      socket.emit("sendMessage", { roomId: room, message: data[0] });
      // SetMessage([...message, data[0]]); // Append the new message to the existing messages array
    } catch (error) {
      console.error("Error:", error);
    }

    setMsgInputValue("");
    inputRef.current?.focus();
  };
  // /////////////////socket

  useEffect(() => {
    socket = io("http://localhost:8000/", {
      extraHeaders: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    socket.on("message", (messages) => {
      console.log(messages, "socket_msg");
      SetMessage((prevmsg) => [...prevmsg, messages]);
      //setMessages((prevMessages) => [...prevMessages, message]);
    });
    return () => {
      socket.off("message");
    };
  }, []);
  //////////////////////

  const getChats = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8000/chat/createCustomer",
        {
          chat_sender: token.payload2.id, // Assuming chat_sender is the user ID
        }
      );
      console.log(response.data.length, "chat");
      if (response.data.length == 0) {
        // console.log( "chatuityu");
        /// if there is not in_session then try to find open session and diplay its message
        const response = await axios.post(
          "http://localhost:8000/chat/get_open_chat_for_customer",
          {
            chat_sender: token.payload2.id, // Assuming chat_sender is the user ID
          }
        );
        console.log(response.data, "open chat");
        if (response.data[0].length == 0) {
          return [];
        }
        set_open_chat_message(response.data[0].Title);
        return [];
      }
      // Emit "joinRoom" event with the retrieved chat ID
      socket.emit("joinRoom", response.data[0].id);
      set_room(response.data[0].id);
      setChat(response.data); // Assuming setChat updates the chat state

      agent = response.data[0].chatReceiverId;
      set_Agent_id(response.data[0].chatReceiverId);
      console.log(agent, "agg");
    } catch (error) {
      console.error("Error fetching chat data:", error);
    }
  };

  /////////////////
  const Getmessages = async () => {
    // console.log(agent, 'agent');
    // console.log(chat,"caht")
    try {
      const data = await axios.post(
        "http://localhost:8000/message/findAll_for_sender",
        {
          agentId: agent,
          customer_id: token.payload2.id,
        }
      );
      if (!data.data) {
        return [];
      }
      SetMessage(data.data);
    } catch (error) {
      console.error("Error fetching chat data:", error);
    }
  };
  ////////////////

  useEffect(() => {
    const fetchData = async () => {
      try {
        getChats().then(() => Getmessages()); // Fetch chat data first
      } catch (error) {
        console.error("Error fetching chat data:", error);
      }
    };

    fetchData();
  }, []);

  //////////////////
  const login = () => {
    const accessTokenString = JSON.stringify({
      access_token:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiZW1haWwiOiJ5ZW51LkAiLCJyb2xlIjoidXNlciIsImlhdCI6MTcxNDA5OTM5OCwiZXhwIjoxNzE5MjgzMzk4fQ.QhHTns8YKlrLbWzK32F9WlNLh8gjmvXuUsSGXepIeIo",
      payload2: {
        id: 3,
        email: "client_1.@",
      },
    });

    localStorage.setItem("access_token", accessTokenString);
  };
  //////////////////////
  useEffect(() => {
    const fetchResolvedSessions = async () => {
      try {
        const token = JSON.parse(localStorage.getItem("access_token"));

        const response = await axios.post(
          "http://localhost:8000/chat/resolved_for_customer",
          {
            chat_sender: token.payload2.id,
          }
        ); // Replace with your API endpoint
        //console.log('test')
        //const data = await response.json();
        console.log(response.data, "side");
        setResolvedSessions(response.data);
      } catch (error) {
        console.error("Error fetching resolved sessions:", error);
      }
    };

    fetchResolvedSessions();
  }, []); // Empty dependency array to fetch data only once on component mount
  /////////////////////
  return (
    <main>
      <MainContainer
        responsive
        style={{
          height: "96vh",
        }}
      >
        <ChatContainer style={chatContainerStyle}>
          <ConversationHeader>
            <ConversationHeader.Content>
              <span
                style={{
                  textAlign: "center",
                  color: "green",
                  animation: "text-color-change 2s infinite alternate",
                  fontSize: "25px",
                }}
              >
                Welcome to our customer support
                {/* <button onClick={()=>login()}>login</button> */}
              </span>
            </ConversationHeader.Content>
          </ConversationHeader>

          <MessageList>
            {/* <MessageSeparator content="Saturday, 30 November 2019" /> */}
            {open_chat_message && (
              <Message
                model={{
                  direction: "outgoing",
                  message: open_chat_message,
                  position: "single",
                  sender: "Zoe",
                }}
              ></Message>
            )}
            {message &&
              message.map((msg) => (
                <Message
                  key={msg.id}
                  model={{
                    direction: msg.Agent_send ? "incoming" : "outgoing",
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
              ))}
          </MessageList>

          {
            <MessageInput
              placeholder="Type message here"
              onSend={handleSend}
              onChange={setMsgInputValue}
              value={msgInputValue}
              ref={inputRef}
            />
          }
        </ChatContainer>
        <Sidebar position="right">
          <button class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
            Resolved Chats
          </button>
          <div className="bg-white rounded-lg shadow-md px-4 py-4">
            {/* <div className="flex justify-between items-center mb-4">
              <button className="px-4 py-2 text-lg font-medium text-gray-700 hover:text-blue-500">
                Resolved ({resolvedSessions && resolvedSessions.length})
              </button>
            </div> */}
            <div className="flex flex-col space-y-2">
              {resolvedSessions &&
                resolvedSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-green-100 cursor-pointer"
                    onClick={() => console.log("clicked")}
                  >
                    <div className="flex flex-col">
                      <p className="text-lg font-medium text-gray-700">
                        {session.Title}
                      </p>{" "}
                      {/* Assuming session object has a `name` property */}
                      <p className="text-sm text-gray-500">
                        Session: {session.session}
                      </p>{" "}
                      {/* Assuming session object has an `id` property */}
                    </div>
                    <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="ml-2 h-6 w-6 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                  </div>
                ))}
            </div>
          </div>
        </Sidebar>
      </MainContainer>
    </main>
  );
}
