# ImgBellFront/Dockerfile
# 이미 빌드된 파일을 사용하는 프로덕션 이미지
FROM nginx:alpine

# 이미 빌드된 dist 폴더 복사
COPY dist/ /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]