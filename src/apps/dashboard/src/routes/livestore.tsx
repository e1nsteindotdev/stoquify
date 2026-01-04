import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/livestore')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/livestore"!</div>
}


// import { useEffect, useRef, useState } from "react"
//
// interface Event {
//   name: string
//   args: any
//   seqNum: number
//   clientId: string
//   sessionId: string
//   parentSeqNum: number
//   createdAt: string
//   [key: string]: any
// }
//
// interface EventItem {
//   eventEncoded: Event
// }
//
// interface ChunkMessage {
//   _tag: "Chunk"
//   values: string[]
// }
//
// interface PullResponse {
//   events: EventItem[]
//   cursor?: { _tag: string }
// }
//
// const storeId = "my-store"
// const payload = { authToken: "insecure-token-change-me" }
//
// export default function CustomPage() {
//   const [events, setEvents] = useState<EventItem[]>([])
//   const [connectionStatus, setConnectionStatus] = useState<string>("Disconnected")
//   const [formData, setFormData] = useState({
//     name: "v1.TodoCreated",
//     args: JSON.stringify({ id: crypto.randomUUID(), text: "New Task" }, null, 2),
//   })
//   const [jsonError, setJsonError] = useState<string | null>(null)
//   const socketRef = useRef<WebSocket | null>(null)
//   // Generate a persistent session ID for this page load
//   const [sessionId] = useState(() => crypto.randomUUID())
//
//   useEffect(() => {
//     const wsUrl = new URL("http://localhost:8787/websocket")
//     wsUrl.searchParams.set("storeId", storeId)
//     wsUrl.searchParams.set("payload", JSON.stringify(payload))
//
//     const socket = new WebSocket(wsUrl.toString())
//     socketRef.current = socket
//
//     socket.onopen = () => {
//       console.log("WebSocket connected")
//       setConnectionStatus("Connected")
//       sendPull(true)
//     }
//
//     socket.onmessage = (event) => {
//       try {
//         const message = JSON.parse(event.data)
//         console.log("Received:", message)
//
//         if (message._tag === "WSMessage.PullRes") {
//           if (message.batch) {
//             setEvents((prev) => [...prev, ...message.batch])
//           }
//         } else if (message._tag === "WSMessage.PushAck") {
//           console.log("Push acknowledged:", message.requestId)
//         } else if (message._tag === "WSMessage.Error") {
//           console.error("Server error:", message.message)
//         }
//       } catch (error) {
//         console.error("Error parsing message:", error)
//       }
//     }
//
//     socket.onerror = (error) => {
//       console.error("WebSocket error:", error)
//       setConnectionStatus("Error")
//     }
//
//     socket.onclose = (event) => {
//       console.log("WebSocket closed:", event.code, event.reason)
//       setConnectionStatus("Disconnected")
//     }
//
//     return () => {
//       socket.close()
//     }
//   }, [])
//
//   const sendPush = (batch: EventItem[]) => {
//     if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
//       const request = {
//         _tag: "WSMessage.PushReq",
//         requestId: crypto.randomUUID(),
//         batch: batch.map((item) => ({
//           ...item.eventEncoded,
//           seqNum: item.eventEncoded.seqNum,
//           clientId: "client-1",
//           sessionId: item.eventEncoded.sessionId,
//           parentSeqNum: item.eventEncoded.parentSeqNum,
//           createdAt: new Date().toISOString(),
//         })),
//       }
//       socketRef.current.send(JSON.stringify(request))
//     }
//   }
//
//   const sendPull = (live: boolean) => {
//     if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
//       const request = {
//         _tag: "WSMessage.PullReq",
//         requestId: crypto.randomUUID(),
//         cursor: undefined
//       }
//       socketRef.current.send(JSON.stringify(request))
//     }
//   }
//
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//
//     let argsData: any
//     try {
//       argsData = JSON.parse(formData.args)
//       setJsonError(null)
//     } catch (error) {
//       setJsonError("Invalid JSON in args data")
//       return
//     }
//     try {
//       const req = await fetch('http://localhost:8787/get-head?storeId=my-store')
//       let { parentSeqNum } = await req.json()
//       console.log('parent seqNum :', parentSeqNum)
//       if (!parentSeqNum) parentSeqNum = 0
//
//       const newEvent: EventItem = {
//         eventEncoded: {
//           name: formData.name,
//           args: argsData,
//           clientId: "client-1",
//           sessionId,
//           seqNum: parentSeqNum + 1,
//           parentSeqNum,
//           createdAt: new Date().toISOString(),
//         },
//       }
//
//       sendPush([newEvent])
//     } catch (e) {
//       console.log('error while pushing event :', e)
//     }
//
//     setFormData((prev) => ({
//       ...prev,
//       args: JSON.stringify({ id: crypto.randomUUID(), text: "New Task" }, null, 2),
//     }))
//   }
//
//   return (
//     <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
//       <h1>Custom Page - Event Manager</h1>
//
//       <div style={{ marginBottom: "20px", padding: "10px", backgroundColor: "#f0f0f0", borderRadius: "4px" }}>
//         <strong>Connection Status:</strong> {connectionStatus}
//       </div>
//
//       <form onSubmit={handleSubmit} style={{ marginBottom: "30px", padding: "20px", border: "1px solid #ccc", borderRadius: "4px" }}>
//         <h2 style={{ marginTop: 0 }}>Push Event</h2>
//
//         <div style={{ marginBottom: "15px" }}>
//           <label style={{ display: "block", marginBottom: "5px" }}>
//             <strong>Event Name:</strong>
//           </label>
//           <input
//             type="text"
//             value={formData.name}
//             onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
//             style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
//             required
//             list="event-names"
//           />
//           <datalist id="event-names">
//             <option value="v1.TodoCreated" />
//             <option value="v1.TodoCompleted" />
//             <option value="v1.TodoUncompleted" />
//             <option value="v1.TodoDeleted" />
//             <option value="v1.TodoClearedCompleted" />
//           </datalist>
//         </div>
//
//         <div style={{ marginBottom: "15px" }}>
//           <label style={{ display: "block", marginBottom: "5px" }}>
//             <strong>Args (JSON):</strong>
//           </label>
//           <textarea
//             value={formData.args}
//             onChange={(e) => setFormData((prev) => ({ ...prev, args: e.target.value }))}
//             style={{ width: "100%", height: "100px", padding: "8px", boxSizing: "border-box", fontFamily: "monospace" }}
//             required
//           />
//           {jsonError && <div style={{ color: "red", marginTop: "5px" }}>{jsonError}</div>}
//         </div>
//
//         <button
//           type="submit"
//           style={{ padding: "10px 20px", backgroundColor: "#0070f3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
//         >
//           Push Event
//         </button>
//       </form>
//
//       <div>
//         <h2>Events ({events.length})</h2>
//         {events.length === 0 ? (
//           <p>No events received yet.</p>
//         ) : (
//           <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
//             {events.map((event, index) => (
//               <div
//                 key={index}
//                 style={{
//                   padding: "15px",
//                   border: "1px solid #ddd",
//                   borderRadius: "4px",
//                   backgroundColor: "#fafafa",
//                 }}
//               >
//                 <div style={{ marginBottom: "10px" }}>
//                   <strong>Name:</strong> {event.eventEncoded.name} |{" "}
//                   <strong>Seq:</strong> {event.eventEncoded.seqNum}
//                 </div>
//                 <pre style={{ margin: 0, backgroundColor: "#f5f5f5", padding: "10px", borderRadius: "4px", overflow: "auto" }}>
//                   {JSON.stringify(event.eventEncoded.args, null, 2)}
//                 </pre>
//                 <div style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}>
//                   Created: {event.eventEncoded.createdAt}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }
