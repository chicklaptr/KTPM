# Hướng dẫn chạy project 

### Bước 1: Mở Terminal
### Bước 2: Chạy lệnh Maven
**Lần đầu tiên (build project):**
```bash
.\mvnw.cmd clean install
```
**Sau đó chạy ứng dụng:**
```bash
.\mvnw.cmd spring-boot:run
```
**Hoặc chạy cả 2 bước cùng lúc:**
```bash
.\mvnw.cmd clean install && .\mvnw.cmd spring-boot:run
```
### Bước 3: Kiểm tra kết quả
Sau khi thấy dòng:
```
Started BluemoonApplication in X.XXX seconds
```
Mở trình duyệt và truy cập: **http://localhost:8082**


## Lệnh nhanh thường dùng

```bash
# Build project
.\mvnw.cmd clean install

# Chạy ứng dụng
.\mvnw.cmd spring-boot:run

# Chạy test
.\mvnw.cmd test

# Xem dependencies
.\mvnw.cmd dependency:tree

# Clean và rebuild
.\mvnw.cmd clean install -DskipTests
```


