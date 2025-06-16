<template>
  <div class="test-notification-page">
    <h2>📢 알림 테스트 페이지</h2>

    <!-- 디버깅 정보 -->
    <div class="debug-info">
      <h3>🐛 디버깅 정보</h3>
      <p>
        <strong>현재 WebSocket URL:</strong> <code>{{ websocketUrl }}</code>
      </p>
      <p>
        <strong>브라우저 위치:</strong> <code>{{ currentLocation }}</code>
      </p>
      <button @click="testWebSocketConnection" class="btn-debug">
        웹소켓 연결 테스트
      </button>
    </div>

    <!-- 접속 정보 표시 -->
    <div class="connection-info">
      <h3>🌐 현재 접속 정보</h3>
      <p><strong>Vue 개발서버:</strong> {{ frontendUrl }}</p>
      <p><strong>Spring 백엔드:</strong> {{ backendUrl }}</p>
      <p><strong>WebSocket:</strong> {{ websocketUrl }}</p>
    </div>

    <div class="buttons">
      <button @click="sendTestNotification" class="btn-primary">
        서버로 알림 보내기 (REST API)
      </button>

      <button @click="sendWebSocketMessage" class="btn-secondary">
        웹소켓으로 메시지 보내기
      </button>

      <button @click="debugSocketStatus" class="btn-debug">
        🔍 웹소켓 상태 확인
      </button>

      <button @click="debugRegisterUser" class="btn-debug">
        🔧 사용자 등록 재시도
      </button>

      <button @click="testCommentNotification" class="btn-warning">
        💬 댓글 알림 테스트 (test1234 → jy1234)
      </button>

      <button @click="testSelfNotification" class="btn-success">
        🔄 자기 자신에게 알림 테스트
      </button>
    </div>

    <div class="info">
      <p>💡 <strong>외부 접속 테스트 방법:</strong></p>
      <ul>
        <li>
          같은 네트워크의 다른 기기에서 <code>{{ frontendUrl }}</code
          >로 접속
        </li>
        <li>Spring Boot 서버도 <code>0.0.0.0:8080</code>으로 실행해야 함</li>
        <li>방화벽에서 5173번(Vue), 8080번(Spring) 포트 허용 필요</li>
        <li>
          Windows 방화벽:
          <code
            >netsh advfirewall firewall add rule name="Vue Dev" dir=in
            action=allow protocol=TCP localport=5173</code
          >
        </li>
        <li>
          <strong>Spring Boot CORS 설정이 가장 중요합니다!</strong>
        </li>
      </ul>
    </div>

    <!-- Spring Boot 설정 참고 -->
    <div class="spring-config">
      <h3>🔧 Spring Boot WebSocket CORS 설정 (핵심!)</h3>
      <div class="code-block critical">
        <h4>❗ WebSocketConfig.java - CORS 설정이 핵심입니다:</h4>
        <pre><code>@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(myWebSocketHandler(), "/ws/notify")
                // 🔥 이 부분이 핵심! 현재 접속하는 IP를 추가해야 함
                .setAllowedOriginPatterns(
                    "http://localhost:*",
                    "http://127.0.0.1:*", 
                    "http://218.38.160.152:*"  // 👈 당신의 IP
                )
                // 또는 개발용으로 모든 IP 허용:
                // .setAllowedOriginPatterns("*")
                ;
    }
}</code></pre>
      </div>
    </div>
  </div>

  <AIImageAnalysisComponent
    imageUrl="https://juneyoung2da.s3.amazonaws.com/image/jpeg/218574dc-d1ca-433e-a407-a7e059cf1729_KakaoTalk_20250528_222209531_15.jpg"
  />
</template>

<script setup lang="ts">
import axios from "axios";
import notificationSocket from "@/utils/notifySocket";
import { ref, onMounted } from "vue";
import AIImageAnalysisComponent from "@/components/AIImageAnalysisComponent.vue";

const frontendUrl = ref("");
const backendUrl = ref("");
const websocketUrl = ref("");
const currentLocation = ref("");

onMounted(() => {
  // 현재 접속 정보 표시
  frontendUrl.value = `http://${window.location.hostname}:5173`;
  backendUrl.value = `http://${window.location.hostname}:8080`;
  currentLocation.value = window.location.href;

  // WebSocket URL 표시
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  websocketUrl.value = `${protocol}//${window.location.hostname}:8080/ws/notify`;

  console.log("🌐 접속 정보:");
  console.log("Frontend URL:", frontendUrl.value);
  console.log("Backend URL:", backendUrl.value);
  console.log("WebSocket URL:", websocketUrl.value);
  console.log("Current location:", currentLocation.value);
});

const sendTestNotification = async () => {
  try {
    await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/notify`, {
      message: "댓글이 달렸어요! 🎉",
    });
    console.log("✅ REST API로 알림 전송 완료");
  } catch (error) {
    console.error("❌ REST API 알림 전송 실패:", error);
    alert("서버 연결에 실패했습니다. Spring 서버가 실행 중인지 확인해주세요.");
  }
};

const sendWebSocketMessage = () => {
  notificationSocket.sendMessage("안녕하세요! 웹소켓 테스트 메시지입니다. 👋");
};

// 디버깅 함수들
const debugSocketStatus = () => {
  notificationSocket.debugSocketStatus();
};

const debugRegisterUser = () => {
  notificationSocket.debugRegisterUser();
};

// 댓글 알림 테스트
const testCommentNotification = async () => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/notify/comment`,
      {
        postId: 1,
        postTitle: "테스트 게시글",
        postUsername: "test1234", // 게시글 작성자 (알림 받을 사람)
        commentAuthorUsername: "jy1234", // 댓글 작성자 (현재 로그인한 사용자)
        commentContent: "테스트 댓글입니다!",
      }
    );
    console.log("📤 댓글 알림 API 호출 결과:", response.data);
    alert("댓글 알림 테스트 완료! 콘솔을 확인하세요.");
  } catch (error) {
    console.error("❌ 댓글 알림 테스트 실패:", error);
    alert("댓글 알림 테스트 실패! 콘솔을 확인하세요.");
  }
};

// 자기 자신에게 알림 테스트
const testSelfNotification = async () => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/notify/comment`,
      {
        postId: 1,
        postTitle: "자체 테스트 게시글",
        postUsername: "jy1234", // 게시글 작성자 (자기 자신)
        commentAuthorUsername: "jy1234", // 댓글 작성자 (자기 자신)
        commentContent: "자체 테스트 댓글입니다!",
      }
    );
    console.log("📤 자체 알림 API 호출 결과:", response.data);
    console.log("자체 알림 테스트 완료! 스낵바가 나타나야 합니다.");
  } catch (error) {
    console.error("❌ 자체 알림 테스트 실패:", error);
    alert("자체 알림 테스트 실패! 콘솔을 확인하세요.");
  }
};

const testWebSocketConnection = () => {
  console.log("🔍 WebSocket 연결 테스트 시작");
  console.log("시도할 URL:", websocketUrl.value);

  const testSocket = new WebSocket(websocketUrl.value);

  testSocket.onopen = () => {
    console.log("✅ 테스트 WebSocket 연결 성공!");
    alert("웹소켓 연결 성공! ✅");
    testSocket.close();
  };

  testSocket.onerror = (error) => {
    console.error("❌ 테스트 WebSocket 연결 실패:", error);
    alert("웹소켓 연결 실패! Spring Boot CORS 설정을 확인하세요. ❌");
  };

  testSocket.onclose = (event) => {
    console.log("🔌 테스트 WebSocket 연결 종료:", event.code, event.reason);
  };
};
</script>

<style scoped>
.test-notification-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h2 {
  color: #333;
  text-align: center;
  margin-bottom: 30px;
}

.debug-info {
  background-color: #f0f8ff;
  border: 2px solid #007bff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
}

.debug-info h3 {
  margin-top: 0;
  color: #007bff;
}

.debug-info p {
  margin: 8px 0;
  font-family: monospace;
}

.btn-debug {
  background-color: #17a2b8;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.btn-debug:hover {
  background-color: #138496;
}

.connection-info {
  background-color: #e7f3ff;
  border: 1px solid #b6d7ff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
}

.connection-info h3 {
  margin-top: 0;
  color: #0056b3;
}

.connection-info p {
  margin: 8px 0;
  font-family: monospace;
  background-color: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
}

.buttons {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;
}

.btn-primary,
.btn-secondary {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
}

.info {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #007bff;
  margin-bottom: 30px;
}

.spring-config {
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 20px;
}

.spring-config h3 {
  margin-top: 0;
  color: #856404;
}

.code-block {
  margin-bottom: 20px;
}

.code-block.critical {
  background-color: #f8d7da;
  border: 2px solid #dc3545;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.code-block.critical h4 {
  color: #721c24;
  margin-top: 0;
}

.code-block h4 {
  color: #495057;
  margin-bottom: 10px;
}

.code-block pre {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 15px;
  overflow-x: auto;
  margin: 0;
}

.code-block code {
  font-family: "Courier New", monospace;
  font-size: 14px;
  color: #495057;
}

.info p {
  margin-top: 0;
  font-weight: bold;
}

.info ul {
  margin-bottom: 0;
}

.info li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.info code {
  background-color: #e9ecef;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 14px;
}
</style>
