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
import { stringify } from "postcss";
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
  const [Chat_room, Set_Chat_room] = useState();
  const [activeTab, setActiveTab] = useState("Open");
  const [openChats, setOpenChats] = useState([]);
  const [resolvedChats, setResolvedChats] = useState([]);
  const [isChatResolved, setIsChatResolved] = useState(false); // State variable to track if chat is resolved
  const [is_blocked, set_is_blocked] = useState(false);
  const [msg_box_is_active, set_msg_box_is_active]=useState(false)

  ///////////////////////////////////
  const token = JSON.parse(localStorage.getItem("access_token"));
  const { access_token } = token;

  // const token = JSON.parse(localStorage.getItem("access_token"));
  const { payload2 } = token;

  ////////////////////////////
  const getOpenChats = async () => {
    try {
      const response = await axios.get("http://localhost:8000/chat/getAll", {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      });
      // console.log(response.data, 'open chats')
      setOpenChats(response.data);
    } catch (error) {
      console.error("Error fetching open chats:", error);
    }
  };
  ///////////////////////////
  const getResolvedChats = async () => {
    try {
      // Retrieve access token from localStorage
      const token = JSON.parse(localStorage.getItem("access_token"));

      // Construct the POST request with headers
      const response = await axios.post(
        "http://localhost:8000/chat/resolved_customer_for_agent",
        {
          chat_receiver: payload2.id,
        },
        {
          headers: {
            Authorization: `Bearer ${token.access_token}`,
          },
        }
      );

      // Sort data by a relevant property (e.g., 'resolved_at' in descending order)
      const sortedData = response.data
        .sort((a, b) => {
          // Assuming 'resolved_at' is a date property
          return new Date(b.resolved_at) - new Date(a.resolved_at);
        })
        .reverse();

      // Update state with sorted data
      setResolvedChats(sortedData);
    } catch (error) {
      console.error("Error fetching resolved chats:", error);
    }
  };
  ////////////////////////////open chat and resolved chat
  useEffect(() => {
    if (activeTab === "Open") {
      getOpenChats();
    } else if (activeTab === "Resolved") {
      getResolvedChats();
    }
  }, [activeTab]);
  ///////////////////////////
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  /////////////////////////
  const accept_req = async (id) => {
    try {
      const response = await axios.patch(
        `http://localhost:8000/chat/in-session`,
        {
          chat_receiver: payload2.id,
          chatId: id,
        },
        {
          headers: {
            Authorization: `Bearer ${token.access_token}`,
          },
        }
      );
      console.log(response, "chatsss");

      ////////////////////////
      const data = await axios.patch(
        `http://localhost:8000/message/update_messages_agent`,
        {
          agentId: payload2.id,
          chatId: id,
        },
        {
          headers: {
            Authorization: `Bearer ${token.access_token}`,
          },
        }
      );
      const filterd_active_chat = openChats.filter((e) => e.chatId == id);
      const filterd = { ...filterd_active_chat[0], chatSession: "in_session" };
      console.log(filterd_active_chat, "selected chat");
      console.log(filterd, "filterd");

      setChat([...chat, filterd]);
    } catch (error) {
      console.error("Error changing it to in session:", error);
    }
  };
  ///////////////////////// socket
  useEffect(() => {
    localStorage.setItem('active_chat_box', JSON.stringify({ state: false, chat: Chat_room }));

    socket = io("http://localhost:8000/", {
      extraHeaders: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    socket.on("Message", (messages) => {
     // console.log(messages, "socket_msg");
      SetMessage((prevmsg) => [...prevmsg, messages]);
      // console.log(messages, "socket")
      //setMessages((prevMessages) => [...prevMessages, message]);
    });
    socket.on("openSession", (sessions) => {
      //  console.log(messages,"socket_msg")
      // console.log(sessions, "socket_open_chat")
      setOpenChats((prevchat) => [...prevchat, sessions]);

      //setMessages((prevMessages) => [...prevMessages, message]);
    });
    //////////
    socket.on("Insession", (sessions) => {
      //  console.log(messages,"socket_msg")
      // console.log(sessions.id, "socket_insession_chat")
      const filter_sessioned_req = openChats.filter(
        (chat) => chat.chatId !== sessions.id
      );
      setOpenChats(filter_sessioned_req);
      console.log(filter_sessioned_req, "testing insession");

      //setMessages((prevMessages) => [...prevMessages, message]);
    });
    ////////////////////////////////////
   
    console.log(msg_box_is_active, "fild wi");
    socket.on("notif", (notif) => {
      if (!msg_box_is_active) {
      setChat((prevChat) =>
        prevChat.map((chat) => {
          if (chat.chatId === notif.chatIdId) {
            return {
              ...chat,
              chatTitle: notif.content,
              unseenMessagesCount: Number(chat.unseenMessagesCount || 0) + 1, // Increment unseenMessagesCount
            };
          }
          return chat; // Ensure the other chats remain unchanged
        })
      );
    }
    });
   
    /////////////////////////
    return () => {
      socket.off("Message");
      socket.off("openSession");
      socket.off("Insession");
      socket.off("notif");
    };
  }, []);
  //////////////////////////
  const handleBackClick = () => setSidebarVisible(!sidebarVisible);
  ///////////////////////
  const handleSend = async (messages) => {
    // console.log(token.payload2.id,"sendmsg")
    const formatted = {
      agentId: token.payload2.id,
      customer_id: active_customer,
      content: messages,
      chatId: Chat_room,
      Agent_send: true,
      Customer_send: false,
    };

    try {
      // console.log(formatted, 'formated')
      const { data } = await axios.post(
        "http://localhost:8000/message/send",
        formatted
      );

      // SetMessage([...message, data[0]]); // Append the new message to the existing messages array
      socket.emit("sendMessage", { roomId: Chat_room, message: data[0] });
    } catch (error) {
      console.error("Error:", error);
    }

    setMsgInputValue("");
    inputRef.current?.focus();
  };
  ////////////////////
  const handleConversationClick = async (agentId, customer_id, chatId) => {
    localStorage.setItem('active_chat_box', JSON.stringify({ state: true, chat: Chat_room }));
    set_msg_box_is_active(true)
    try {
      if (sidebarVisible) {
        setSidebarVisible(false);
      }
      const data = await axios.post(
        "http://localhost:8000/message/findAll_for_sender",
        {
          agentId,
          customer_id,
          chatId,
        }
      );

      //  console.log(data,'messages getted')
      SetMessage(data.data);
      Set_Chat_room(chatId);
      const respons = await axios.patch(
        "http://localhost:8000/message/make_msg_seen",
        {
          chatID: chatId,
        }
      );
      //console.log(respons,"respons")

      if (respons) {
        console.log(respons, "respons");
        const updatedChats = chat.map((chat) => {
          if (chat.chatId === chatId) {
            return {
              ...chat,
              unseenMessagesCount: 0,
            };
          }
        });
        setChat(updatedChats);
      }

      //  socket.emit("joinRoom", chatId);

      set_active_customer(customer_id);
      await set_current_chat(chat.filter((c) => c.chatId === chatId)); // Await setting current chat
      set_Message_field_active(true);
      setIsChatResolved(false);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };
  //////////////////////////style
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
        console.warn("No token found. User ID cannot be retrieved.");
        return; // Early exit if no token
      }

      const response = await axios.post(
        "http://localhost:8000/chat/get",
        {
          chat_receiver: token.payload2.id,
        },
        {
          headers: {
            Authorization: `Bearer ${token.access_token}`, // Include token for authentication
          },
        }
      );
      // console.log(response.data, "response chat");

      const chats = response.data; // Assuming response.data contains the chat array
      // console.log(chats, "chats");
      // Sort chats based on chatCreatedAt in descending order (latest first)
      const sortedChats = chats.sort((a, b) => {
        const dateA = new Date(a.chatCreatedAt);
        const dateB = new Date(b.chatCreatedAt);
        return dateB.getTime() - dateA.getTime(); // Descending order
      });

      // Filter resolved chats (assuming "resolved" is the value)
      const resolvedChats = sortedChats.filter(
        (chat) => chat.chatSession === "resolved"
      );
      const unresolvedChats = sortedChats.filter(
        (chat) => chat.chatSession !== "resolved"
      );

      // Combine chats in desired order: unresolved first, then resolved
      const combinedChats = [...unresolvedChats, ...resolvedChats];

      // Update chat state
      setChat(combinedChats);
    } catch (error) {
      console.error("Error fetching chat data:", error);
    }
  };
  ////////////////////
  const handleResolve = async () => {
    const id = current_chat[0].chatId;
    // console.log(current_chat[0])
    const response = await axios.patch(
      `http://localhost:8000/chat/resolved/${id}`
    );
    // console.log(response.data,"resolved");
    const filt = chat.filter((e) => e.chatId !== id);
    setChat(filt);
    SetMessage([]);
    set_Message_field_active(false);
  };
  //////////////////////////
  const getResolvedMessages = async (chatId) => {
    const data = await axios.post(
      "http://localhost:8000/message/get-resolved-messages",
      {
        chatId: chatId,
      }
    );
    const datas = data.data;
    //console.log(datas, "datatatata");
    SetMessage(datas);
    //console.log(message, "messagesssss");
    setIsChatResolved(true);
    set_Message_field_active(true);
  };
  ///////////////////
  const handleUnBlock = async () => {
    // console.log(current_chat[0], "current");
    const id = current_chat[0].chatSenderId;
    try {
      const response = await axios.patch(
        `http://localhost:8000/customers/Unblock/${id}`
      );

      // Update state only if the API call is successful
      if (response.status === 200) {
        // Check for success status code
        const updatedChat = {
          ...current_chat[0],
          chatSender: {
            ...current_chat[0].chatSender,
            isBlocked: 0, // Set 'isBlocked' to 0
          },
        };
        console.log(updatedChat, "up un");
        set_current_chat([updatedChat]);
        set_is_blocked(false);
      } else {
        console.error("Error unblocking user:", response); // Log error for debugging
      }
    } catch (error) {
      console.error("Error unblocking user:", error); // Log error for debugging
    }
  };
  const handleBlock = async () => {
    //console.log(current_chat[0], "current");

    const id = current_chat[0].chatSenderId;
    try {
      const response = await axios.patch(
        `http://localhost:8000/customers/block/${id}`
      );

      // Update state only if the API call is successful
      if (response.status === 200) {
        const updatedChat = {
          ...current_chat[0],
          chatSender: {
            ...current_chat[0].chatSender,
            isBlocked: 1, // Set 'isBlocked' to 1
          },
        };
        // console.log(updatedChat, "up");
        set_current_chat([updatedChat]);
        set_is_blocked(true);
      } else {
        console.error("Error blocking user:", response); // Log error for debugging
      }
    } catch (error) {
      console.error("Error blocking user:", error); // Log error for debugging
    }
  };
  ///////////////////getChats
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
                  unreadCnt={chats.unseenMessagesCount}
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
                      className="hover:bg-red-600 px-4 py-2 ml-2 rounded bg-red-500 text-white font-bold"
                      onClick={handleUnBlock}
                    >
                      UnBlock
                    </button>
                  ) : (
                    <button
                      className="hover:bg-red-600 px-4 py-2 ml-2 rounded bg-red-500 text-white font-bold"
                      onClick={handleBlock}
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
          //active_customer
          {!isChatResolved ? (
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
          <div className="flex flex-col">
            <div className="flex bg-gray-200 p-2 mb-4">
              <button
                className={`mr-2 px-4 py-2 rounded ${
                  activeTab === "Open"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-300"
                }`}
                onClick={() => handleTabChange("Open")}
              >
                Open
              </button>
              <button
                className={`px-4 py-2 rounded ${
                  activeTab === "Resolved"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-300"
                }`}
                onClick={() => handleTabChange("Resolved")}
              >
                Resolved
              </button>
            </div>

            <div className="flex flex-col">
              <div className="overflow-y-auto">
                {activeTab === "Open" &&
                  openChats &&
                  openChats.map((chat) => (
                    <div
                      key={chat.chatId}
                      className="flex items-center justify-between border-b border-gray-200 py-2 px-4"
                    >
                      <div className="flex flex-col">
                        <span className="text-lg">
                          {chat.chatSender?.service_name}
                        </span>
                        <p className="text-gray-600 text-sm mt-1">
                          <span>{chat.chatSender?.name}:</span>
                          {chat?.chatTitle.length > 20
                            ? `${chat?.chatTitle.substring(0, 20)}...`
                            : chat?.chatTitle}
                        </p>
                      </div>
                      <button
                        className="ml-2 px-4 py-1 rounded bg-blue-500 text-white font-bold hover:bg-blue-700"
                        onClick={() => accept_req(chat.chatId)}
                      >
                        Open
                      </button>
                    </div>
                  ))}
                {activeTab === "Resolved" &&
                  resolvedChats &&
                  resolvedChats.map((chat) => (
                    <div
                      key={chat.chatId}
                      className="flex items-center justify-between border-b border-gray-200 py-2 px-4 hover:bg-green-100 cursor-pointer"
                      onClick={() => getResolvedMessages(chat.chatId)}
                    >
                      <div className="flex flex-col">
                        <span className="text-lg">
                          {chat.chatSender?.service_name}
                        </span>
                        <p className="text-gray-600 text-sm mt-1">
                          <span>{chat.chatSender?.name}:</span>{" "}
                          {chat?.chatTitle.length > 20
                            ? `${chat?.chatTitle.substring(0, 20)}...`
                            : chat?.chatTitle}
                        </p>
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
          </div>
        </Sidebar>
      </MainContainer>
    </main>
  );
}
