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
  InfoButton,
  ConversationHeader,
  ToggleConversationListUsingBackButtonStory,
} from "@chatscope/chat-ui-kit-react";
import styles from "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
// import UserListComponent from "./right";
import { useCallback, useEffect,useRef, useState } from "react";
import axios from "axios";
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
  const [active_customer, set_active_customer] = useState("");
  const [message, SetMessage] = useState([]);

  ///////////////////////////////////
  const handleBackClick = () => setSidebarVisible(!sidebarVisible);

  const handleConversationClick = useCallback(() => {
    if (sidebarVisible) {
      setSidebarVisible(false);
    }
  }, [sidebarVisible, setSidebarVisible]);

  const handleSend = async (messages) => {
    const formatted = {
      agentId: 3,
      customer_id: 1,
      content: messages,
      Agent_send: false,
      Customer_send: true,
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

  //////////////////////
  const getChats = async () => {
    try {
      // const token = localStorage.getItem('access_token');

      // if (!token) {
      //   console.warn('No token found. User ID cannot be retrieved.');
      //   return; // Early exit if no token
      // }
        const response = await axios.post(
        'http://localhost:8000/chat/createCustomer',{
          chat_sender: 1
        },
        // {
        //   headers: {
        //     Authorization: `Bearer ${token}`, // Include token for authentication
        //   },
        // }
      );
      console.log(response.data,"dataaaa")
      setChat(response.data);
    } catch (error) {
      console.error('Error fetching chat data:', error);
    }
  };

  useEffect(() => {
    getChats();
  }, []);
 /////////////////
  const messages = async () => {
    try{
      const data = await axios.post(
        "http://localhost:8000/message/findAll_for_sender",
        {
          
          agentId: 3,
          customer_id: 1,
        }
      );
      console.log(data, "message data")
      SetMessage(data.data);
    }catch(error){
      console.error('Error fetching chat data:', error);
    }
  }

  useEffect(()=>{
    messages(chat)
  }, [])



 //////////////////

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
          <ConversationHeader.Back />
          {/* <Avatar
            name="Eliot"
            src="https://chatscope.io/storybook/react/assets/eliot-JNkqSAth.svg"
          /> */}
          <ConversationHeader.Content>
            <span style={{ textAlign: 'center', color: 'green', animation: 'text-color-change 2s infinite alternate', fontSize: '25px' }}>
              Welcome to our customer support
            </span>
          </ConversationHeader.Content>
        </ConversationHeader>



        <MessageList>
        {/* <MessageSeparator content="Saturday, 30 November 2019" /> */}
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
        {/* <Sidebar position="right">
          <UserListComponent />
          {/* {  <button class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
                Open
              </button>} */}
        {/* </Sidebar> */} 
      </MainContainer>
    </main>
  );
}