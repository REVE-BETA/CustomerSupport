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
  ConversationList,
  Conversation,
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
  const [chatContainerStyle, setChatContainerStyle] = useState({});
  const [conversationContentStyle, setConversationContentStyle] = useState({});
  const [conversationAvatarStyle, setConversationAvatarStyle] = useState({});
  ///////////////////////////////////
  const [chat, setChat] = useState([]);
  const [message, SetMessage] = useState([]);
  const [room, set_room] = useState();
  const [Agent_id, set_Agent_id] = useState();
  const [open_chat_message, set_open_chat_message] = useState();
  const [resolvedSessions, setResolvedSessions] = useState([]);
  const [isChatResolved, setIsChatResolved] = useState(false); // State variable to track if chat is resolved
  const [sidebarStyle, setSidebarStyle] = useState({});

  ///////////////////////////////////

  const token = JSON.parse(localStorage.getItem("access_token"));
  const { access_token } = token;
  let agent;
  const handleBackClick = () => setSidebarVisible(!sidebarVisible);
  /////////////////
  const handleSend = async (messages) => {
    console.log(Agent_id, "agent");
    const formatted = {
      agentId: Agent_id, // agent,
      customer_id: token.payload2.id, ///
      content: messages, ///
      Agent_send: false,
      Customer_send: true,
      chatId: room,
    };
    try {
      // console.log(formatted, "fofoffofo");
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
      // socket.emit("sendMessage", { roomId: room, message: data[0] });
      console.log(message, "testmsg");
      //if (message.length == 0) {
        SetMessage([...message, data[0]]);
     // } // Append the new message to the existing messages array
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
    ////////////////////
    socket.on("Message", (messages) => {
      console.log(messages, "socket_msg");
      //console.log(messages, "socket_msg");

      set_Agent_id(messages.agentId)/* this is for debugging when the socket session is resolved 
      and the message sending is not awair of it then we set the agent id*/
      set_room(messages.chatIdId)// this to if the msg is resolved we have to change the chat id and the agent id on the first msg
      SetMessage((prevmsg) => [...prevmsg, messages]);

    });
    //////////////////
    socket.on("resolved", (messages) => {
      if (messages.session == "resolved") {
        SetMessage([]);
       // set_room(null)
        set_Agent_id(null)
      }
      
    });

    return () => {
      socket.off("message");
    };
  }, []);
  ////////////////////// style
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
    setConversationAvatarStyle,
    setSidebarStyle,
    setChatContainerStyle,
  ]);
  //////////////
  const getChats = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8000/chat/createCustomer",
        {
          chat_sender: token.payload2.id, // Assuming chat_sender is the user ID
        }
      );
  // if there is open chat then get that
      if (response.data.length == 0) {
        //  console.log( "chatuityu");
        /// if there is not in_session then try to find open session and diplay its message
        const response = await axios.post(
          "http://localhost:8000/chat/get_open_chat_for_customer",
          {
            chat_sender: token.payload2.id, // Assuming chat_sender is the user ID
          }
        );
        //  console.log(response.data, "open chat");
        if (response.data[0].length == 0) {
          return [];
        }
        set_open_chat_message(response.data[0].Title);
        const data = await axios.post(
          "http://localhost:8000/message/findAll_for_sender",
          {
            chatId: response.data[0].id,
          }
        );
        SetMessage(data.data);
      }
      /////////////////////
      set_room(response.data[0].id);
      setChat(response.data);
      agent = response.data[0].chatReceiverId;
      set_Agent_id(response.data[0].chatReceiverId);
     
      try {
        const data = await axios.post(
          "http://localhost:8000/message/findAll_for_sender",
          {
            chatId: response.data[0].id,
          }
        );
        //console.log(data.data, "get me msg", room);
        if (!data.data) {
          return [];
        }
        SetMessage(data.data);
      } catch (error) {
        console.error("Error fetching chat data:", error);
      }
    } catch (error) {
      console.error("Error fetching chat data:", error);
    }
  };
  ////////////////
  const getAllResolvedMessages = async (chatId) => {
    if (sidebarVisible) {
      setSidebarVisible(false);
    }
    const response = await axios.post(
      "http://localhost:8000/message/get-resolved-messages",
      { chatId: chatId }
    );
    console.log(chatId, "iddd");
    const resmessages = response.data;
    console.log(resmessages, "resolved messages list");
    console.log(response.data, "dataaaa");
    SetMessage(response.data);
    setIsChatResolved(true);
    // setGetResolvedMessages((prev) => [...prevmsg, data.data])
  };
  ///////////////////////get chats and message
  useEffect(() => {
    const fetchData = async () => {
      try {
        getChats(); //.then(() => Getmessages()); // Fetch chat data first
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
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJjMS5AIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3MTU1OTM0MzgsImV4cCI6MTcyMDc3NzQzOH0.1erlF4rpQr7KeX3tluXx357gmmzQpLmQXPqt0BTWkvA",
      payload2: {
        id: 1,
        email: "c1.@",
      },
    });

    localStorage.setItem("access_token", accessTokenString);
  };
  //////////////////////get resolved chats
  useEffect(() => {
    const fetchResolvedSessions = async () => {
      try {
        const token = JSON.parse(localStorage.getItem("access_token"));

        const response = await axios.post(
          "http://localhost:8000/chat/resolved_for_customer",
          {
            chat_sender: token.payload2.id,
          }
        );

        // Sort data by a relevant property (e.g., 'resolved_at' in descending order)
        const sortedData = response.data
          .sort((a, b) => {
            // Assuming 'resolved_at' is a date property
            return new Date(b.resolved_at) - new Date(a.resolved_at);
          })
          .reverse();

        setResolvedSessions(sortedData);
      } catch (error) {
        console.error("Error fetching resolved sessions:", error);
      }
    };

    fetchResolvedSessions();
  }, []); // Empty dependency array to fetch data only once on component mount
  ///////////////////// when active chat is clicked
  const active_chat = () => {
    SetMessage([]);
    getChats();
    setIsChatResolved(false);
  };
  return (
    <main>
      <MainContainer
        responsive
        style={{
          height: "100vh",
        }}
      >
        <Sidebar position="right" style={sidebarStyle}>
          <button class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
            Resolved Chats
          </button>
          <ConversationList>
            <div className="bg-white rounded-lg shadow-md px-4 py-4">
              <div className="flex flex-col space-y-2 ">
                {resolvedSessions &&
                  resolvedSessions.map((session) => (
                    <Conversation
                      onClick={() => getAllResolvedMessages(session.id)}
                    >
                      <Conversation.Content
                        name={session.session}
                        lastSenderName="Report"
                        info={session.Title}
                        style={conversationContentStyle}
                         />
               
                    </Conversation>
                   
                    ))}
              </div>
            </div>
          </ConversationList>
        </Sidebar>
        <ChatContainer style={chatContainerStyle}>
          <ConversationHeader>
            <ConversationHeader.Back onClick={handleBackClick} />
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
                {/* <button onClick={() => login()}>loginN</button> */}
              </span>
              <button
                onClick={() => active_chat()}
                class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
              >
                Set Active Chat
              </button>
            </ConversationHeader.Content>
          </ConversationHeader>

          <MessageList>
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

          {!isChatResolved && (
            <MessageInput
              placeholder="Type message here"
              onSend={handleSend}
              onChange={setMsgInputValue}
              value={msgInputValue}
              ref={inputRef}
            />
          )}
        </ChatContainer>
      </MainContainer>
    </main>
  );
}
