FROM openjdk:11

ADD karate-1.1.0.jar .
ADD mock.sh .

RUN mkdir /features
VOLUME /features

EXPOSE 8088

CMD ["/mock.sh", "/features"]
