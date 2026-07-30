FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY . .
# Даем права на исполнение для mvnw перед сборкой
RUN chmod +x mvnw
RUN ./mvnw clean package -DskipTests -Dfile.encoding=UTF-8

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]