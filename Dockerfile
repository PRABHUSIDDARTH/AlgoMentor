FROM eclipse-temurin:21-jdk AS build
# The Node binary that frontend-maven-plugin downloads needs libatomic.
RUN apt-get update && apt-get install -y --no-install-recommends libatomic1 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN ./mvnw -B -q dependency:go-offline
COPY src src
COPY frontend frontend
RUN ./mvnw -B -q package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/algomentor-*.jar app.jar
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
