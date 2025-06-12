// notifySocket.ts
import { ref } from "vue";

class NotificationSocket {
  private socket: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private userId: number | null = null;
  private username: string | null = null;

  // 알림 상태 관리용 reactive variables
  public hasNewNotification = ref(false);
  public notificationMessage = ref("");
  public notificationCallback: ((notification: any) => void) | null = null;

  constructor() {
    // 동적으로 웹소켓 URL 생성
    this.url = this.getWebSocketUrl();
    console.log("🔗 WebSocket URL:", this.url);
  }

  private getWebSocketUrl(): string {
    // 현재 페이지의 호스트 정보를 가져와서 웹소켓 URL 생성
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname;

    // 개발 환경에서는 8080 포트 사용 (Spring Boot 기본 포트)
    // 운영 환경에서는 환경변수나 설정에 따라 다르게 설정 가능
    const port = import.meta.env.VITE_WS_PORT || "8080";

    return `${protocol}//${host}:${port}/ws/notify`;
  }

  // 사용자 ID와 함께 웹소켓 연결
  public connectWithUser(userId: number, username?: string) {
    this.userId = userId;
    this.username = username || null;
    this.connect();
  }

  private connect() {
    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        console.log("✅ WebSocket 연결됨");
        this.reconnectAttempts = 0; // 연결 성공시 재연결 횟수 초기화

        // 연결 성공 후 약간의 지연을 두고 사용자 ID 등록
        // (서버가 연결을 완전히 처리할 시간을 줌)
        if (this.userId) {
          const userId = this.userId; // null 체크 후 변수에 할당
          const username = this.username;
          setTimeout(() => {
            console.log("⏰ 연결 후 500ms 지연 후 사용자 등록 시도");
            this.registerUser(userId, username);
          }, 500);
        }
      };

      this.socket.onmessage = (event) => {
        console.log("📩 메시지 도착:", event.data);

        try {
          const notification = JSON.parse(event.data);
          this.handleNotification(notification);
        } catch (error) {
          // JSON이 아닌 경우 일반 텍스트로 처리
          this.handleNotification({ message: event.data, type: "text" });
        }
      };

      this.socket.onclose = (event) => {
        console.log("❌ WebSocket 연결 종료:", event.code, event.reason);
        this.handleReconnect();
      };

      this.socket.onerror = (error) => {
        console.error("🚨 WebSocket 에러:", error);
      };
    } catch (error) {
      console.error("WebSocket 연결 실패:", error);
      this.handleReconnect();
    }
  }

  // 서버에 사용자 ID 등록
  private registerUser(userId: number, username: string | null = null) {
    console.log("🚀 registerUser 호출됨:", { userId, username });
    console.log("🔍 웹소켓 상태:", this.socket?.readyState);

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const registerMessage = {
        type: "register", // 백엔드와 일치하도록 수정
        userId: userId,
        username: username,
      };

      console.log("📤 등록 메시지 전송:", JSON.stringify(registerMessage));
      this.socket.send(JSON.stringify(registerMessage));
      console.log(
        `👤 사용자 ID ${userId}, Username: ${username} 등록 메시지 전송 완료`
      );
    } else {
      console.error(
        "❌ 웹소켓이 열려있지 않음. 상태:",
        this.socket?.readyState
      );
      console.log("🔄 1초 후 재시도...");

      // 1초 후 재시도
      setTimeout(() => {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          console.log("🔄 웹소켓 재연결 후 사용자 등록 재시도");
          this.registerUser(userId, username);
        }
      }, 1000);
    }
  }

  // 알림 메시지 처리
  private handleNotification(notification: any) {
    console.log("🔔 알림 수신:", notification);
    const message = notification.message || notification;

    // 시스템 메시지는 스낵바에 표시하지 않음
    if (notification.type === "registered") {
      console.log("✅ 사용자 등록 확인됨 (스낵바 표시 안함)");
      return;
    }

    // 상태 업데이트
    this.hasNewNotification.value = true;
    this.notificationMessage.value = message;

    // 콜백 함수가 있으면 실행 (스낵바 표시용) - notification 전체 객체 전달
    if (this.notificationCallback) {
      this.notificationCallback(notification);
      console.log("📞 알림 콜백 함수 호출됨:", notification);
    } else {
      console.log("⚠️ 알림 콜백 함수가 등록되지 않음");
    }

    // 브라우저 알림도 표시 (시스템 메시지 제외)
    this.showBrowserNotification(message);
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `🔄 재연결 시도 중... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );

      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay);
    } else {
      console.error("🚫 최대 재연결 시도 횟수 초과");
    }
  }

  private showBrowserNotification(message: string) {
    // 브라우저 알림 권한 요청 및 표시
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("새 알림", {
          body: message,
          icon: "/favicon.ico",
        });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification("새 알림", {
              body: message,
            });
          }
        });
      }
    }
  }

  // 알림 콜백 설정 (스낵바 표시용)
  public setNotificationCallback(callback: (notification: any) => void) {
    this.notificationCallback = callback;
    console.log("🔗 알림 콜백 함수 등록됨");
  }

  // 알림 상태 초기화
  public clearNotification() {
    this.hasNewNotification.value = false;
    this.notificationMessage.value = "";
  }

  // 메시지 전송 메서드
  public sendMessage(message: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message);
    } else {
      console.warn("WebSocket이 연결되지 않았습니다.");
    }
  }

  // 디버깅용 - 수동으로 사용자 등록 다시 시도
  public debugRegisterUser() {
    console.log("🔧 수동 사용자 등록 시도 호출됨");
    console.log("📊 현재 사용자 정보:", {
      userId: this.userId,
      username: this.username,
      socketState: this.socket?.readyState,
      socketOpen: this.socket?.readyState === WebSocket.OPEN,
    });

    if (this.userId && this.username) {
      console.log(
        "✅ 사용자 정보 확인됨, 등록 시도:",
        this.userId,
        this.username
      );
      this.registerUser(this.userId, this.username);
    } else {
      console.log("❌ 사용자 정보가 불완전함:", {
        userId: this.userId,
        username: this.username,
      });
    }
  }

  // 디버깅용 - 현재 웹소켓 상태 확인
  public debugSocketStatus() {
    console.log("🔍 웹소켓 상태 디버깅:");
    console.log("- 소켓 존재:", !!this.socket);
    console.log("- 연결 상태:", this.socket?.readyState);
    console.log("- 사용자 ID:", this.userId);
    console.log("- 사용자명:", this.username);
    console.log("- 콜백 함수:", !!this.notificationCallback);
  }

  // 연결 종료
  public disconnect() {
    if (this.socket) {
      this.socket.close();
    }
  }

  // 현재 연결 상태 확인
  public isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

// 싱글톤 인스턴스 생성
const notificationSocket = new NotificationSocket();

export default notificationSocket;
