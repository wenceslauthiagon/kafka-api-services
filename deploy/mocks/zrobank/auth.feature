Feature: genial create qrcode dynamic mock server

    Scenario: pathMatches('/auth/signin') && methodIs('post')
        * def responseStatus = 200
        * def response =
            """
            {
                "success": true,
                "data": {
                    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwaG9uZV9udW1iZXIiOiI1NTgxOTk1NjU3Nzc3IiwiaWF0IjoxNjkzOTM2NDY5LCJ2ZXJzaW9uIjoiMiIsImlkIjoiYjI4MTYzZWMtM2QyOC00Nzg2LWExNTQtN2EyOGFiMzYwMGE2IiwicmVmcmVzaF90b2tlbiI6eyJ1dWlkIjoiOWI3NzVkNTYtNWUwMC00NTU1LTk0ODUtNjEwNDQ2NGQzNWYyIiwiZWF0IjoiMjAyMy0wOS0wNVQxNzo1ODo0OC43NjhaIn0sImRpc2FibGVkX3NlcnZpY2VzIjpudWxsLCJleHAiOjE2OTQyNTE4Mjl9.Kga3GIfNmN98msJpSvSnCyHhE57ZbZbEhkFaOQdrht4"
                },
                "error": null
            }
            """