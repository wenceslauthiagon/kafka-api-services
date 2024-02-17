export const createPixInfractionIssueBodyRest = {
  description: 'Notification for create issue sent for Jira',
  example: `{
    "id":"11955",
    "self":"https://zrolabs.atlassian.net/rest/api/2/11955",
    "key":"COMPSUPCLI-3",
    "fields":{
       "statuscategorychangedate":"2022-03-29T18:03:33.752-0300",
       "issuetype":{
          "self":"https://zrolabs.atlassian.net/rest/api/2/issuetype/10020",
          "id":"10020",
          "description":"",
          "iconUrl":"https://zrolabs.atlassian.net/rest/api/2/universal_avatar/view/type/issuetype/avatar/10555?size=medium",
          "name":"PIX Infraction",
          "subtask":false,
          "avatarId":10555,
          "hierarchyLevel":0
       },
       "timespent":null,
       "project":{
          "self":"https://zrolabs.atlassian.net/rest/api/2/project/10006",
          "id":"10006",
          "key":"COMPSUPCLI",
          "name":"Compliance Suporte",
          "projectTypeKey":"software",
          "simplified":false,
          "avatarUrls":{
             "48x48":"https://zrolabs.atlassian.net/rest/api/2/universal_avatar/view/type/project/avatar/10402",
             "24x24":"https://zrolabs.atlassian.net/rest/api/2/universal_avatar/view/type/project/avatar/10402?size=small",
             "16x16":"https://zrolabs.atlassian.net/rest/api/2/universal_avatar/view/type/project/avatar/10402?size=xsmall",
             "32x32":"https://zrolabs.atlassian.net/rest/api/2/universal_avatar/view/type/project/avatar/10402?size=medium"
          }
       },
       "customfield_10032":null,
       "aggregatetimespent":null,
       "resolutiondate":null,
       "workratio":-1,
       "lastViewed":null,
       "issuerestriction":{
          "issuerestrictions":{
             
          },
          "shouldDisplay":false
       },
       "watches":{
          "self":"https://zrolabs.atlassian.net/rest/api/2/issue/COMPSUPCLI-3/watchers",
          "watchCount":0,
          "isWatching":true
       },
       "customfield_10060":null,
       "customfield_10061":null,
       "created":"2022-03-29T18:03:33.327-0300",
       "customfield_10062":null,
       "customfield_10063":null,
       "customfield_10020":null,
       "customfield_10021":null,
       "customfield_10022":null,
       "customfield_10023":null,
       "priority":{
          "self":"https://zrolabs.atlassian.net/rest/api/2/priority/2",
          "iconUrl":"https://zrolabs.atlassian.net/images/icons/priorities/high.svg",
          "name":"High",
          "id":"2"
       },
       "customfield_10024":null,
       "customfield_10025":null,
       "labels":[
          "API"
       ],
       "customfield_10016":null,
       "customfield_10017":null,
       "customfield_10018":{
          "hasEpicLinkFieldDependency":false,
          "showField":false,
          "nonEditableReason":{
             "reason":"PLUGIN_LICENSE_ERROR",
             "message":"El enlace principal solo está disponible para los usuarios de Jira Premium."
          }
       },
       "customfield_10019":"0|i0074v:",
       "timeestimate":null,
       "aggregatetimeoriginalestimate":null,
       "issuelinks":[
          {
             "id":"11513",
             "self":"https://zrolabs.atlassian.net/rest/api/2/issueLink/11513",
             "type":{
                "id":"10000",
                "name":"Blocks",
                "inward":"is blocked by",
                "outward":"blocks",
                "self":"https://zrolabs.atlassian.net/rest/api/2/issueLinkType/10000"
             },
             "outwardIssue":{
                "id":"11834",
                "key":"COMPSUPCLI-2",
                "self":"https://zrolabs.atlassian.net/rest/api/2/issue/11834",
                "fields":{
                   "summary":"123123213",
                   "status":{
                      "self":"https://zrolabs.atlassian.net/rest/api/2/status/6",
                      "description":"La incidencia se considera finalizada, la resolución es correcta. Las incidencias que están cerradas pueden ser reabiertas.",
                      "iconUrl":"https://zrolabs.atlassian.net/images/icons/statuses/closed.png",
                      "name":"Cerrada",
                      "id":"6",
                      "statusCategory":{
                         "self":"https://zrolabs.atlassian.net/rest/api/2/statuscategory/3",
                         "id":3,
                         "key":"done",
                         "colorName":"green",
                         "name":"Listo"
                      }
                   },
                   "priority":{
                      "self":"https://zrolabs.atlassian.net/rest/api/2/priority/3",
                      "iconUrl":"https://zrolabs.atlassian.net/images/icons/priorities/medium.svg",
                      "name":"Medium",
                      "id":"3"
                   },
                   "issuetype":{
                      "self":"https://zrolabs.atlassian.net/rest/api/2/issuetype/10020",
                      "id":"10020",
                      "description":"",
                      "iconUrl":"https://zrolabs.atlassian.net/rest/api/2/universal_avatar/view/type/issuetype/avatar/10555?size=medium",
                      "name":"PIX Infraction",
                      "subtask":false,
                      "avatarId":10555,
                      "hierarchyLevel":0
                   }
                }
             }
          }
       ],
       "assignee":{
          "self":"https://zrolabs.atlassian.net/rest/api/2/user?accountId=0",
          "accountId":"0",
          "avatarUrls":{
             "48x48":"https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/48",
             "24x24":"https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/24",
             "16x16":"https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/16",
             "32x32":"https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/32"
          },
          "displayName":"Zro Tester",
          "active":true,
          "timeZone":"America/Recife",
          "accountType":"atlassian"
       },
       "updated":"2022-03-29T18:03:33.327-0300",
       "status":{
          "self":"https://zrolabs.atlassian.net/rest/api/2/status/1",
          "description":"The PIX infraction is new and is waiting creation approval",
          "iconUrl":"https://zrolabs.atlassian.net/images/icons/statuses/open.png",
          "name":"NEW",
          "id":"1",
          "statusCategory":{
             "self":"https://zrolabs.atlassian.net/rest/api/2/statuscategory/2",
             "id":2,
             "key":"new",
             "colorName":"blue-gray",
             "name":"new"
          }
       },
       "timeoriginalestimate":null,
       "customfield_10051":"6a848ba4-fe3d-4bc9-ba76-de8ab4d6d0d8",
       "customfield_10052":null,
       "customfield_10053":null,
       "description":"Teste create api jira zrobank",
       "customfield_10054":{
          "self":"https://zrolabs.atlassian.net/rest/api/2/customFieldOption/10044",
          "value":"FRAUD",
          "id":"10044"
       },
       "customfield_10010":null,
       "customfield_10055":null,
       "customfield_10056":null,
       "customfield_10057":null,
       "customfield_10014":null,
       "customfield_10058":null,
       "customfield_10015":null,
       "timetracking":{
          
       },
       "customfield_10059":null,
       "security":null,
       "attachment":[
          
       ],
       "aggregatetimeestimate":null,
       "summary":"Teste create api jira zrobank",
       "creator":{
          "self":"https://zrolabs.atlassian.net/rest/api/2/user?accountId=0",
          "accountId":"0",
          "avatarUrls":{
             "48x48":"https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/48",
             "24x24":"https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/24",
             "16x16":"https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/16",
             "32x32":"https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/32"
          },
          "displayName":"Zro Tester",
          "active":true,
          "timeZone":"America/Recife",
          "accountType":"atlassian"
       },
       "subtasks":[
          
       ],
       "customfield_10040":null,
       "customfield_10041":null,
       "customfield_10042":null,
       "customfield_10043":null,
       "reporter":{
          "self":"https://zrolabs.atlassian.net/rest/api/2/user?accountId=0",
          "accountId":"0",
          "avatarUrls":{
             "48x48":"https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/48",
             "24x24":"https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/24",
             "16x16":"https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/16",
             "32x32":"https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/32"
          },
          "displayName":"Zro Tester",
          "active":true,
          "timeZone":"America/Recife",
          "accountType":"atlassian"
       },
       "customfield_10044":null,
       "aggregateprogress":{
          "progress":0,
          "total":0
       },
       "customfield_10000":"{}",
       "customfield_10001":null,
       "customfield_10045":null,
       "customfield_10002":null,
       "customfield_10046":[
          
       ],
       "customfield_10003":null,
       "duedate":null,
       "progress":{
          "progress":0,
          "total":0
       },
       "votes":{
          "self":"https://zrolabs.atlassian.net/rest/api/2/issue/COMPSUPCLI-3/votes",
          "votes":0,
          "hasVoted":false
       }
    }
 }`,
};

export const updatePixInfractionIssueBodyRest = {
  description: 'Notification for update issue sent for Jira',
  example: `{
    "changelog": {
      "id": "27318",
      "items": [
        {
          "field": "status",
          "fieldId": "status",
          "fieldtype": "jira",
          "from": "1",
          "fromString": "New",
          "to": "10030",
          "toString": "OPENED"
        }
      ]
    },
    "issue": {
      "fields": {
        "aggregateprogress": {
          "progress": 0,
          "total": 0
        },
        "aggregatetimeestimate": null,
        "aggregatetimeoriginalestimate": null,
        "aggregatetimespent": null,
        "assignee": {
          "accountId": "0",
          "accountType": "atlassian",
          "active": true,
          "avatarUrls": {
            "16x16": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/16",
            "24x24": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/24",
            "32x32": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/32",
            "48x48": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/48"
          },
          "displayName": "Test",
          "self": "https://zrolabs.atlassian.net/rest/api/2/user?accountId=0",
          "timeZone": "America/Recife"
        },
        "attachment": [],
        "created": "2022-03-29T18:03:33.327-0300",
        "creator": {
          "accountId": "0",
          "accountType": "atlassian",
          "active": true,
          "avatarUrls": {
            "16x16": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/16",
            "24x24": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/24",
            "32x32": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/32",
            "48x48": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/48"
          },
          "displayName": "Test",
          "self": "https://zrolabs.atlassian.net/rest/api/2/user?accountId=0",
          "timeZone": "America/Recife"
        },
        "customfield_10000": "{}",
        "customfield_10001": null,
        "customfield_10002": null,
        "customfield_10003": null,
        "customfield_10010": null,
        "customfield_10014": null,
        "customfield_10015": null,
        "customfield_10016": null,
        "customfield_10017": null,
        "customfield_10018": {
          "hasEpicLinkFieldDependency": false,
          "nonEditableReason": {
            "message": "El enlace principal solo está disponible para los usuarios de Jira Premium.",
            "reason": "PLUGIN_LICENSE_ERROR"
          },
          "showField": false
        },
        "customfield_10019": "0|i0074v:",
        "customfield_10020": null,
        "customfield_10021": null,
        "customfield_10022": null,
        "customfield_10023": null,
        "customfield_10024": null,
        "customfield_10025": null,
        "customfield_10032": null,
        "customfield_10040": null,
        "customfield_10041": null,
        "customfield_10042": null,
        "customfield_10043": null,
        "customfield_10044": null,
        "customfield_10045": null,
        "customfield_10046": [],
        "customfield_10051": "eaef98c3-1498-4191-b796-72cb497bae40",
        "customfield_10052": null,
        "customfield_10053": null,
        "customfield_10054": {
          "id": "10044",
          "self": "https://zrolabs.atlassian.net/rest/api/2/customFieldOption/10044",
          "value": "FRAUD"
        },
        "customfield_10055": "texto",
        "customfield_10056": null,
        "customfield_10057": null,
        "customfield_10058": null,
        "customfield_10059": null,
        "customfield_10060": null,
        "customfield_10061": null,
        "customfield_10062": null,
        "customfield_10063": null,
        "description": "Teste create api jira zrobank",
        "duedate": null,
        "issuelinks": [
          {
            "id": "11513",
            "outwardIssue": {
              "fields": {
                "issuetype": {
                  "avatarId": 10555,
                  "description": "",
                  "hierarchyLevel": 0,
                  "iconUrl": "https://zrolabs.atlassian.net/rest/api/2/universal_avatar/view/type/issuetype/avatar/10555?size=medium",
                  "id": "10020",
                  "name": "PIX Infraction",
                  "self": "https://zrolabs.atlassian.net/rest/api/2/issuetype/10020",
                  "subtask": false
                },
                "priority": {
                  "iconUrl": "https://zrolabs.atlassian.net/images/icons/priorities/medium.svg",
                  "id": "3",
                  "name": "Medium",
                  "self": "https://zrolabs.atlassian.net/rest/api/2/priority/3"
                },
                "status": {
                  "description": "La incidencia se considera finalizada, la resolución es correcta. Las incidencias que están cerradas pueden ser reabiertas.",
                  "iconUrl": "https://zrolabs.atlassian.net/images/icons/statuses/closed.png",
                  "id": "6",
                  "name": "Cerrada",
                  "self": "https://zrolabs.atlassian.net/rest/api/2/status/6",
                  "statusCategory": "[Object]"
                },
                "summary": "123123213"
              },
              "id": "11834",
              "key": "COMPSUPCLI-2",
              "self": "https://zrolabs.atlassian.net/rest/api/2/issue/11834"
            },
            "self": "https://zrolabs.atlassian.net/rest/api/2/issueLink/11513",
            "type": {
              "id": "10000",
              "inward": "is blocked by",
              "name": "Blocks",
              "outward": "blocks",
              "self": "https://zrolabs.atlassian.net/rest/api/2/issueLinkType/10000"
            }
          }
        ],
        "issuerestriction": {
          "issuerestrictions": {},
          "shouldDisplay": false
        },
        "issuetype": {
          "avatarId": 10555,
          "description": "",
          "hierarchyLevel": 0,
          "iconUrl": "https://zrolabs.atlassian.net/rest/api/2/universal_avatar/view/type/issuetype/avatar/10555?size=medium",
          "id": "10020",
          "name": "PIX Infraction",
          "self": "https://zrolabs.atlassian.net/rest/api/2/issuetype/10020",
          "subtask": false
        },
        "labels": [
          "API"
        ],
        "lastViewed": "2022-04-14T16:59:55.048-0300",
        "priority": {
          "iconUrl": "https://zrolabs.atlassian.net/images/icons/priorities/high.svg",
          "id": "2",
          "name": "High",
          "self": "https://zrolabs.atlassian.net/rest/api/2/priority/2"
        },
        "progress": {
          "progress": 0,
          "total": 0
        },
        "project": {
          "avatarUrls": {
            "16x16": "https://zrolabs.atlassian.net/rest/api/2/universal_avatar/view/type/project/avatar/10402?size=xsmall",
            "24x24": "https://zrolabs.atlassian.net/rest/api/2/universal_avatar/view/type/project/avatar/10402?size=small",
            "32x32": "https://zrolabs.atlassian.net/rest/api/2/universal_avatar/view/type/project/avatar/10402?size=medium",
            "48x48": "https://zrolabs.atlassian.net/rest/api/2/universal_avatar/view/type/project/avatar/10402"
          },
          "id": "10006",
          "key": "COMPSUPCLI",
          "name": "Compliance Suporte",
          "projectTypeKey": "software",
          "self": "https://zrolabs.atlassian.net/rest/api/2/project/10006",
          "simplified": false
        },
        "reporter": {
          "accountId": "0",
          "accountType": "atlassian",
          "active": true,
          "avatarUrls": {
            "16x16": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/16",
            "24x24": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/24",
            "32x32": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/32",
            "48x48": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/48"
          },
          "displayName": "Test",
          "self": "https://zrolabs.atlassian.net/rest/api/2/user?accountId=0",
          "timeZone": "America/Recife"
        },
        "resolutiondate": null,
        "security": null,
        "status": {
          "description": "PIX infraction was opened and it's waiting for third-party to receive it.",
          "iconUrl": "https://zrolabs.atlassian.net/images/icons/statuses/generic.png",
          "id": "10030",
          "name": "OPENED",
          "self": "https://zrolabs.atlassian.net/rest/api/2/status/10030",
          "statusCategory": {
            "colorName": "yellow",
            "id": 4,
            "key": "indeterminate",
            "name": "In Progress",
            "self": "https://zrolabs.atlassian.net/rest/api/2/statuscategory/4"
          }
        },
        "statuscategorychangedate": "2022-04-14T17:00:03.742-0300",
        "subtasks": [],
        "summary": "Teste create api jira zrobank",
        "timeestimate": null,
        "timeoriginalestimate": null,
        "timespent": null,
        "timetracking": {},
        "updated": "2022-03-29T18:03:33.327-0300",
        "votes": {
          "hasVoted": false,
          "self": "https://zrolabs.atlassian.net/rest/api/2/issue/COMPSUPCLI-3/votes",
          "votes": 0
        },
        "watches": {
          "isWatching": true,
          "self": "https://zrolabs.atlassian.net/rest/api/2/issue/COMPSUPCLI-3/watchers",
          "watchCount": 1
        },
        "workratio": -1
      },
      "id": "11955",
      "key": "COMPSUPCLI-3",
      "self": "https://zrolabs.atlassian.net/rest/api/2/11955"
    },
    "issue_event_type_name": "issue_generic",
    "timestamp": 1649966403771,
    "user": {
      "accountId": "0",
      "accountType": "atlassian",
      "active": true,
      "avatarUrls": {
        "16x16": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/16",
        "24x24": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/24",
        "32x32": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/32",
        "48x48": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/48"
      },
      "displayName": "Test",
      "self": "https://zrolabs.atlassian.net/rest/api/2/user?accountId=0",
      "timeZone": "America/Recife"
    },
    "webhookEvent": "jira:issue_updated"
  }`,
};

export const updateUserLimitRequestIssueBodyRest = {
  description: 'Notification for update issue sent for Jira',
  example: `{
    "changelog": {
      "id": "27318",
      "items": [
        {
          "field": "status",
          "fieldId": "status",
          "fieldtype": "jira",
          "from": "1",
          "fromString": "New",
          "to": "10030",
          "toString": "OPENED"
        }
      ]
    },
    "issue": {
      "fields": {
        "aggregateprogress": {
          "progress": 0,
          "total": 0
        },
        "aggregatetimeestimate": null,
        "aggregatetimeoriginalestimate": null,
        "aggregatetimespent": null,
        "assignee": {
          "accountId": "0",
          "accountType": "atlassian",
          "active": true,
          "avatarUrls": {
            "16x16": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/16",
            "24x24": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/24",
            "32x32": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/32",
            "48x48": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/48"
          },
          "displayName": "Zro Tester",
          "self": "https://zrolabs.atlassian.net/rest/api/2/user?accountId=0",
          "timeZone": "America/Recife"
        },
        "attachment": [],
        "created": "2022-03-29T18:03:33.327-0300",
        "creator": {
          "accountId": "0",
          "accountType": "atlassian",
          "active": true,
          "avatarUrls": {
            "16x16": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/16",
            "24x24": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/24",
            "32x32": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/32",
            "48x48": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/48"
          },
          "displayName": "Zro Tester",
          "self": "https://zrolabs.atlassian.net/rest/api/2/user?accountId=0",
          "timeZone": "America/Recife"
        },
        "customfield_10000": "{}",
        "customfield_10085": {
          "id": "10054",
          "self": "https://zrolabs.atlassian.net/rest/api/2/customFieldOption/10044",
          "value": "APPROVED"
        },
        "customfield_10089": "fb8752f9-4f09-4140-85a7-6d83448e9264",
        "customfield_10001": null,
        "customfield_10002": null,
        "customfield_10003": null,
        "customfield_10010": null,
        "customfield_10014": null,
        "customfield_10015": null,
        "customfield_10016": null,
        "customfield_10017": null,
        "customfield_10018": {
          "hasEpicLinkFieldDependency": false,
          "nonEditableReason": {
            "message": "El enlace principal solo está disponible para los usuarios de Jira Premium.",
            "reason": "PLUGIN_LICENSE_ERROR"
          },
          "showField": false
        },
        "customfield_10019": "0|i0074v:",
        "customfield_10020": null,
        "customfield_10021": null,
        "customfield_10022": null,
        "customfield_10023": null,
        "customfield_10024": null,
        "customfield_10025": null,
        "customfield_10032": null,
        "customfield_10040": null,
        "customfield_10041": null,
        "customfield_10042": null,
        "customfield_10043": null,
        "customfield_10044": null,
        "customfield_10045": null,
        "customfield_10046": [],
        "customfield_10051": "eaef98c3-1498-4191-b796-72cb497bae40",
        "customfield_10052": null,
        "customfield_10053": null,
        "customfield_10054": {
          "id": "10044",
          "self": "https://zrolabs.atlassian.net/rest/api/2/customFieldOption/10044",
          "value": "FRAUD"
        },
        "customfield_10055": "texto",
        "customfield_10056": null,
        "customfield_10057": null,
        "customfield_10058": null,
        "customfield_10059": null,
        "customfield_10060": null,
        "customfield_10061": null,
        "customfield_10062": null,
        "customfield_10063": null,
        "description": "Teste create api jira zrobank",
        "duedate": null,
        "issuelinks": [
          {
            "id": "11513",
            "outwardIssue": {
              "fields": {
                "issuetype": {
                  "avatarId": 10555,
                  "description": "",
                  "hierarchyLevel": 0,
                  "iconUrl": "https://zrolabs.atlassian.net/rest/api/2/universal_avatar/view/type/issuetype/avatar/10555?size=medium",
                  "id": "10020",
                  "name": "PIX Infraction",
                  "self": "https://zrolabs.atlassian.net/rest/api/2/issuetype/10020",
                  "subtask": false
                },
                "priority": {
                  "iconUrl": "https://zrolabs.atlassian.net/images/icons/priorities/medium.svg",
                  "id": "3",
                  "name": "Medium",
                  "self": "https://zrolabs.atlassian.net/rest/api/2/priority/3"
                },
                "status": {
                  "description": "La incidencia se considera finalizada, la resolución es correcta. Las incidencias que están cerradas pueden ser reabiertas.",
                  "iconUrl": "https://zrolabs.atlassian.net/images/icons/statuses/closed.png",
                  "id": "6",
                  "name": "Cerrada",
                  "self": "https://zrolabs.atlassian.net/rest/api/2/status/6",
                  "statusCategory": "[Object]"
                },
                "summary": "123123213"
              },
              "id": "11834",
              "key": "COMPSUPCLI-2",
              "self": "https://zrolabs.atlassian.net/rest/api/2/issue/11834"
            },
            "self": "https://zrolabs.atlassian.net/rest/api/2/issueLink/11513",
            "type": {
              "id": "10000",
              "inward": "is blocked by",
              "name": "Blocks",
              "outward": "blocks",
              "self": "https://zrolabs.atlassian.net/rest/api/2/issueLinkType/10000"
            }
          }
        ],
        "issuerestriction": {
          "issuerestrictions": {},
          "shouldDisplay": false
        },
        "issuetype": {
          "avatarId": 10555,
          "description": "",
          "hierarchyLevel": 0,
          "iconUrl": "https://zrolabs.atlassian.net/rest/api/2/universal_avatar/view/type/issuetype/avatar/10555?size=medium",
          "id": "10020",
          "name": "PIX Infraction",
          "self": "https://zrolabs.atlassian.net/rest/api/2/issuetype/10020",
          "subtask": false
        },
        "labels": [
          "API"
        ],
        "lastViewed": "2022-04-14T16:59:55.048-0300",
        "priority": {
          "iconUrl": "https://zrolabs.atlassian.net/images/icons/priorities/high.svg",
          "id": "2",
          "name": "High",
          "self": "https://zrolabs.atlassian.net/rest/api/2/priority/2"
        },
        "progress": {
          "progress": 0,
          "total": 0
        },
        "project": {
          "avatarUrls": {
            "16x16": "https://zrolabs.atlassian.net/rest/api/2/universal_avatar/view/type/project/avatar/10402?size=xsmall",
            "24x24": "https://zrolabs.atlassian.net/rest/api/2/universal_avatar/view/type/project/avatar/10402?size=small",
            "32x32": "https://zrolabs.atlassian.net/rest/api/2/universal_avatar/view/type/project/avatar/10402?size=medium",
            "48x48": "https://zrolabs.atlassian.net/rest/api/2/universal_avatar/view/type/project/avatar/10402"
          },
          "id": "10006",
          "key": "COMPSUPCLI",
          "name": "Compliance Suporte",
          "projectTypeKey": "software",
          "self": "https://zrolabs.atlassian.net/rest/api/2/project/10006",
          "simplified": false
        },
        "reporter": {
          "accountId": "0",
          "accountType": "atlassian",
          "active": true,
          "avatarUrls": {
            "16x16": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/16",
            "24x24": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/24",
            "32x32": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/32",
            "48x48": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/48"
          },
          "displayName": "Zro Tester",
          "self": "https://zrolabs.atlassian.net/rest/api/2/user?accountId=0",
          "timeZone": "America/Recife"
        },
        "resolutiondate": null,
        "security": null,
        "status": {
          "description": "PIX infraction was opened and it's waiting for third-party to receive it.",
          "iconUrl": "https://zrolabs.atlassian.net/images/icons/statuses/generic.png",
          "id": "10030",
          "name": "CLOSED",
          "self": "https://zrolabs.atlassian.net/rest/api/2/status/10030",
          "statusCategory": {
            "colorName": "yellow",
            "id": 4,
            "key": "indeterminate",
            "name": "In Progress",
            "self": "https://zrolabs.atlassian.net/rest/api/2/statuscategory/4"
          }
        },
        "statuscategorychangedate": "2022-04-14T17:00:03.742-0300",
        "subtasks": [],
        "summary": "Teste create api jira zrobank",
        "timeestimate": null,
        "timeoriginalestimate": null,
        "timespent": null,
        "timetracking": {},
        "updated": "2022-03-29T18:03:33.327-0300",
        "votes": {
          "hasVoted": false,
          "self": "https://zrolabs.atlassian.net/rest/api/2/issue/COMPSUPCLI-3/votes",
          "votes": 0
        },
        "watches": {
          "isWatching": true,
          "self": "https://zrolabs.atlassian.net/rest/api/2/issue/COMPSUPCLI-3/watchers",
          "watchCount": 1
        },
        "workratio": -1
      },
      "id": "11955",
      "key": "COMPSUPCLI-3",
      "self": "https://zrolabs.atlassian.net/rest/api/2/11955"
    },
    "issue_event_type_name": "issue_generic",
    "timestamp": 1649966403771,
    "user": {
      "accountId": "0",
      "accountType": "atlassian",
      "active": true,
      "avatarUrls": {
        "16x16": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/16",
        "24x24": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/24",
        "32x32": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/32",
        "48x48": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/0/703fcbba-eab9-4799-b08c-cca1f1de249a/48"
      },
      "displayName": "Zro Tester",
      "self": "https://zrolabs.atlassian.net/rest/api/2/user?accountId=0",
      "timeZone": "America/Recife"
    },
    "webhookEvent": "jira:issue_updated"
  }`,
};

export const updatePixRefundIssueBodyRest = {
  description: 'Notification for update issue sent for Jira',
  example: `{
   "issue":{      
        "fields":{
            "assignee":{
                "displayName":"Zro Tester"
            },
            "created":"2022-03-29T18:03:33.327-0300",
            "creator":{
                "displayName":"Zro Tester",
                "self":"https://zrolabs.atlassian.net/rest/api/2/user?accountId=0",
                "timeZone":"America/Recife"
            },
            "customfield_10019":"0|i0074v:",
            "customfield_10051":"eaef98c3-1498-4191-b796-72cb497bae40",
            "customfield_10052":null,
            "customfield_10053":null,
            "customfield_10070":{
                "id":"10051",
                "self":"https://zrolabs.atlassian.net/rest/api/2/customFieldOption/10044",
                "value":"FRAUD"
            },
            "customfield_10088":{
                "self":"https://zrolabs.atlassian.net/rest/api/2/customFieldOption/10059",
                "value":"Others",
                "id":"10059"
            },
            "customfield_10087":"Cancelado por algum motivo",
            "customfield_10055":"texto",
            "customfield_10059":"10050",
            "customfield_10067":"e2bef23c-63b3-49ca-a1f2-26f43db065af",
            "description":"Test",
            "duedate":null,
            "issuetype":{
                "id":"10020",
                "name":"PIX Infraction"
            },
            "lastViewed":"2022-04-14T16:59:55.048-0300",
            "reporter":{
                "displayName":"Zro Tester"
            },
            "resolutiondate":null,
            "security":null,
            "status":{
                "id":"10030",
                "name":"CANCELLED"
            },
            "summary":"Test",
            "updated":"2022-03-29T18:03:33.327-0300"
        },
        "id":"11955",
        "key":"COMPSUPCLI-3",
        "self":"https://zrolabs.atlassian.net/rest/api/2/11955"
        },
        "issue_event_type_name":"issue_generic",
        "webhookEvent":"jira:issue_updated"
  }`,
};

export const updateWarningTransactionIssueBodyRest = {
  description: 'Notification for update issue sent for Jira',
  example: `{
    "expand":"renderedFields,names,schema,operations,editmeta,changelog,versionedRepresentations,customfield_10042.properties,customfield_10010.requestTypePractice",
    "id":"13324",
    "self":"https://zrolabs.atlassian.net/rest/api/2/issue/13324",
    "key":"COMPSUPCLI-97",
    "fields":{
       "statuscategorychangedate":"2022-12-06T16:42:14.890-0300",
       "customfield_10070":null,
       "customfield_10071":null,
       "customfield_10072":null,
       "customfield_10073":null,
       "customfield_10074":null,
       "customfield_10075":null,
       "customfield_10076":null,
       "customfield_10077":null,
       "fixVersions":[
          
       ],
       "customfield_10078":null,
       "customfield_10079":null,
       "resolution":null,
       "lastViewed":"2022-12-06T16:43:33.950-0300",
       "customfield_10060":null,
       "customfield_10061":null,
       "customfield_10062":null,
       "customfield_10063":null,
       "customfield_10064":null,
       "customfield_10067":null,
       "priority":{
          "self":"https://zrolabs.atlassian.net/rest/api/2/priority/3",
          "iconUrl":"https://zrolabs.atlassian.net/images/icons/priorities/medium.svg",
          "name":"Medium",
          "id":"3"
       },
       "customfield_10068":null,
       "customfield_10069":null,
       "labels":[
          
       ],
       "aggregatetimeoriginalestimate":null,
       "timeestimate":null,
       "versions":[
          
       ],
       "issuelinks":[
          
       ],
       "assignee":null,
       "status":{
          "self":"https://zrolabs.atlassian.net/rest/api/2/status/1",
          "description":"The PIX infraction is new and is waiting creation approval",
          "iconUrl":"https://zrolabs.atlassian.net/images/icons/statuses/open.png",
          "name":"New",
          "id":"1",
          "statusCategory":{
             "self":"https://zrolabs.atlassian.net/rest/api/2/statuscategory/2",
             "id":2,
             "key":"new",
             "colorName":"blue-gray",
             "name":"To Do"
          }
       },
       "components":[
          
       ],
       "customfield_10051":null,
       "customfield_10052":null,
       "customfield_10053":null,
       "customfield_10054":null,
       "customfield_10055":null,
       "customfield_10056":null,
       "customfield_10057":null,
       "customfield_10058":null,
       "customfield_10059":null,
       "aggregatetimeestimate":null,
       "creator":{
          "self":"https://zrolabs.atlassian.net/rest/api/2/user?accountId=0",
          "accountId":"0",
          "emailAddress":"test@zrobank.com.br",
          "avatarUrls":{
             "48x48":"https://secure.gravatar.com/avatar/4b43e08add3c999a8cdf8e4864e9b7b8?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FMT-6.png",
             "24x24":"https://secure.gravatar.com/avatar/4b43e08add3c999a8cdf8e4864e9b7b8?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FMT-6.png",
             "16x16":"https://secure.gravatar.com/avatar/4b43e08add3c999a8cdf8e4864e9b7b8?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FMT-6.png",
             "32x32":"https://secure.gravatar.com/avatar/4b43e08add3c999a8cdf8e4864e9b7b8?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FMT-6.png"
          },
          "displayName":"Zro Tester",
          "active":true,
          "timeZone":"America/Recife",
          "accountType":"atlassian"
       },
       "subtasks":[
          
       ],
       "customfield_10040":"",
       "customfield_10041":0.0,
       "customfield_10042":null,
       "customfield_10043":null,
       "reporter":{
          "self":"https://zrolabs.atlassian.net/rest/api/2/user?accountId=0",
          "accountId":"0",
          "emailAddress":"test@zrobank.com.br",
          "avatarUrls":{
             "48x48":"https://secure.gravatar.com/avatar/4b43e08add3c999a8cdf8e4864e9b7b8?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FMT-6.png",
             "24x24":"https://secure.gravatar.com/avatar/4b43e08add3c999a8cdf8e4864e9b7b8?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FMT-6.png",
             "16x16":"https://secure.gravatar.com/avatar/4b43e08add3c999a8cdf8e4864e9b7b8?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FMT-6.png",
             "32x32":"https://secure.gravatar.com/avatar/4b43e08add3c999a8cdf8e4864e9b7b8?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FMT-6.png"
          },
          "displayName":"Zro Tester",
          "active":true,
          "timeZone":"America/Recife",
          "accountType":"atlassian"
       },
       "aggregateprogress":{
          "progress":0,
          "total":0
       },
       "customfield_10044":null,
       "customfield_10045":null,
       "customfield_10046":[
          
       ],
       "customfield_10038":null,
       "progress":{
          "progress":0,
          "total":0
       },
       "votes":{
          "self":"https://zrolabs.atlassian.net/rest/api/2/issue/COMPSUPCLI-97/votes",
          "votes":0,
          "hasVoted":false
       },
       "worklog":{
          "startAt":0,
          "maxResults":20,
          "total":0,
          "worklogs":[
             
          ]
       },
       "issuetype":{
          "self":"https://zrolabs.atlassian.net/rest/api/2/issuetype/10028",
          "id":"10028",
          "description":"Created warning transaction after analise transaction",
          "iconUrl":"https://zrolabs.atlassian.net/rest/api/2/universal_avatar/view/type/issuetype/avatar/10559?size=medium",
          "name":"Warning Transaction",
          "subtask":false,
          "avatarId":10559,
          "hierarchyLevel":0
       },
       "timespent":null,
       "customfield_10030":null,
       "customfield_10031":null,
       "project":{
          "self":"https://zrolabs.atlassian.net/rest/api/2/project/10006",
          "id":"10006",
          "key":"COMPSUPCLI",
          "name":"Compliance Suporte",
          "projectTypeKey":"software",
          "simplified":false,
          "avatarUrls":{
             "48x48":"https://zrolabs.atlassian.net/rest/api/2/universal_avatar/view/type/project/avatar/10402",
             "24x24":"https://zrolabs.atlassian.net/rest/api/2/universal_avatar/view/type/project/avatar/10402?size=small",
             "16x16":"https://zrolabs.atlassian.net/rest/api/2/universal_avatar/view/type/project/avatar/10402?size=xsmall",
             "32x32":"https://zrolabs.atlassian.net/rest/api/2/universal_avatar/view/type/project/avatar/10402?size=medium"
          }
       },
       "customfield_10032":null,
       "customfield_10033":null,
       "aggregatetimespent":null,
       "customfield_10034":null,
       "customfield_10035":null,
       "resolutiondate":null,
       "workratio":-1,
       "watches":{
          "self":"https://zrolabs.atlassian.net/rest/api/2/issue/COMPSUPCLI-97/watchers",
          "watchCount":1,
          "isWatching":true
       },
       "issuerestriction":{
          "issuerestrictions":{
             
          },
          "shouldDisplay":false
       },
       "created":"2022-12-06T16:42:14.510-0300",
       "customfield_10020":null,
       "customfield_10021":null,
       "customfield_10022":null,
       "customfield_10023":null,
       "customfield_10024":null,
       "customfield_10025":null,
       "customfield_10016":null,
       "customfield_10017":null,
       "customfield_10018":{
          "hasEpicLinkFieldDependency":false,
          "showField":false,
          "nonEditableReason":{
             "reason":"PLUGIN_LICENSE_ERROR",
             "message":"The Parent Link is only available to Jira Premium users."
          }
       },
       "customfield_10019":"0|i00elr:",
       "updated":"2022-12-06T16:42:14.510-0300",
       "customfield_10093":null,
       "customfield_10094":null,
       "timeoriginalestimate":null,
       "customfield_10095":null,
       "customfield_10096":null,
       "description":null,
       "customfield_10097":null,
       "customfield_10010":null,
       "customfield_10014":null,
       "customfield_10015":null,
       "timetracking":{
          
       },
       "customfield_10005":null,
       "customfield_10006":null,
       "security":null,
       "customfield_10007":null,
       "customfield_10008":null,
       "attachment":[
          
       ],
       "customfield_10009":null,
       "summary":"teste do end-to end",
       "customfield_10080":null,
       "customfield_10081":null,
       "customfield_10082":null,
       "customfield_10083":null,
       "customfield_10084":null,
       "customfield_10085":null,
       "customfield_10086":"Para que a demanda seja finalizada em Downstream, ela precisa cumprir os tópicos elencados abaixo. Observe a legenda e aplique-a nos requisitos da Definition of Done(DoD):\r\n\r\n - Está OK!\r\n - Não está OK!\r\n - não se aplica!\r\n\r\n1. Estar em ambiente de Produção.\r\n2. Cumprir todos os critérios de aceite específicos.\r\n3. Ter passado por Code Review.\r\n4. Ter Passado por QA.\r\n5. Cumprir todos os critérios de aceite específicos.\r\n6. Ter sido aprovada no Teste Regressivo.",
       "customfield_10087":null,
       "customfield_10000":"{}",
       "customfield_10088":null,
       "customfield_10001":null,
       "customfield_10089":null,
       "customfield_10002":null,
       "customfield_10003":null,
       "customfield_10004":null,
       "environment":null,
       "duedate":null,
       "comment":{
          "comments":[
             
          ],
          "self":"https://zrolabs.atlassian.net/rest/api/2/issue/13324/comment",
          "maxResults":0,
          "total":0,
          "startAt":0
       }
    }
 }`,
};

export const updateUserWithdrawSettingRequestIssueBodyRest = {
  description: 'Notification for update issue sent for Jira',
  example: `{
    "expand":"renderedFields,names,schema,operations,editmeta,changelog,versionedRepresentations,customfield_10042.properties,customfield_10010.requestTypePractice",
    "id":"13324",
    "self":"https://zrolabs.atlassian.net/rest/api/2/issue/13324",
    "key":"COMPSUPCLI-97",
    "fields":{
       "statuscategorychangedate":"2022-12-06T16:42:14.890-0300",
       "customfield_10070":null,
       "customfield_10071":null,
       "customfield_10072":null,
       "customfield_10073":null,
       "customfield_10074":null,
       "customfield_10075":null,
       "customfield_10076":null,
       "customfield_10077":null,
       "fixVersions":[
          
       ],
       "customfield_10078":null,
       "customfield_10079":null,
       "resolution":null,
       "lastViewed":"2022-12-06T16:43:33.950-0300",
       "customfield_10060":null,
       "customfield_10061":null,
       "customfield_10062":null,
       "customfield_10063":null,
       "customfield_10064":null,
       "customfield_10067":null,
       "priority":{
          "self":"https://zrolabs.atlassian.net/rest/api/2/priority/3",
          "iconUrl":"https://zrolabs.atlassian.net/images/icons/priorities/medium.svg",
          "name":"Medium",
          "id":"3"
       },
       "customfield_10068":null,
       "customfield_10069":null,
       "labels":[
          
       ],
       "aggregatetimeoriginalestimate":null,
       "timeestimate":null,
       "versions":[
          
       ],
       "issuelinks":[
          
       ],
       "assignee":null,
       "status":{
          "self":"https://zrolabs.atlassian.net/rest/api/2/status/1",
          "description":"The PIX infraction is new and is waiting creation approval",
          "iconUrl":"https://zrolabs.atlassian.net/images/icons/statuses/open.png",
          "name":"New",
          "id":"1",
          "statusCategory":{
             "self":"https://zrolabs.atlassian.net/rest/api/2/statuscategory/2",
             "id":2,
             "key":"new",
             "colorName":"blue-gray",
             "name":"To Do"
          }
       },
       "components":[
          
       ],
       "customfield_10051":null,
       "customfield_10052":null,
       "customfield_10053":null,
       "customfield_10054":null,
       "customfield_10055":null,
       "customfield_10056":null,
       "customfield_10057":null,
       "customfield_10058":null,
       "customfield_10059":null,
       "aggregatetimeestimate":null,
       "creator":{
          "self":"https://zrolabs.atlassian.net/rest/api/2/user?accountId=0",
          "accountId":"0",
          "emailAddress":"test@zrobank.com.br",
          "avatarUrls":{
             "48x48":"https://secure.gravatar.com/avatar/4b43e08add3c999a8cdf8e4864e9b7b8?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FMT-6.png",
             "24x24":"https://secure.gravatar.com/avatar/4b43e08add3c999a8cdf8e4864e9b7b8?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FMT-6.png",
             "16x16":"https://secure.gravatar.com/avatar/4b43e08add3c999a8cdf8e4864e9b7b8?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FMT-6.png",
             "32x32":"https://secure.gravatar.com/avatar/4b43e08add3c999a8cdf8e4864e9b7b8?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FMT-6.png"
          },
          "displayName":"Zro Tester",
          "active":true,
          "timeZone":"America/Recife",
          "accountType":"atlassian"
       },
       "subtasks":[
          
       ],
       "customfield_10040":"",
       "customfield_10041":0.0,
       "customfield_10042":null,
       "customfield_10043":null,
       "reporter":{
          "self":"https://zrolabs.atlassian.net/rest/api/2/user?accountId=0",
          "accountId":"0",
          "emailAddress":"test@zrobank.com.br",
          "avatarUrls":{
             "48x48":"https://secure.gravatar.com/avatar/4b43e08add3c999a8cdf8e4864e9b7b8?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FMT-6.png",
             "24x24":"https://secure.gravatar.com/avatar/4b43e08add3c999a8cdf8e4864e9b7b8?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FMT-6.png",
             "16x16":"https://secure.gravatar.com/avatar/4b43e08add3c999a8cdf8e4864e9b7b8?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FMT-6.png",
             "32x32":"https://secure.gravatar.com/avatar/4b43e08add3c999a8cdf8e4864e9b7b8?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FMT-6.png"
          },
          "displayName":"Zro Tester",
          "active":true,
          "timeZone":"America/Recife",
          "accountType":"atlassian"
       },
       "aggregateprogress":{
          "progress":0,
          "total":0
       },
       "customfield_10044":null,
       "customfield_10045":null,
       "customfield_10046":[
          
       ],
       "customfield_10038":null,
       "progress":{
          "progress":0,
          "total":0
       },
       "votes":{
          "self":"https://zrolabs.atlassian.net/rest/api/2/issue/COMPSUPCLI-97/votes",
          "votes":0,
          "hasVoted":false
       },
       "worklog":{
          "startAt":0,
          "maxResults":20,
          "total":0,
          "worklogs":[
             
          ]
       },
       "issuetype":{
          "self":"https://zrolabs.atlassian.net/rest/api/2/issuetype/10028",
          "id":"10028",
          "description":"Created warning transaction after analise transaction",
          "iconUrl":"https://zrolabs.atlassian.net/rest/api/2/universal_avatar/view/type/issuetype/avatar/10559?size=medium",
          "name":"Warning Transaction",
          "subtask":false,
          "avatarId":10559,
          "hierarchyLevel":0
       },
       "timespent":null,
       "customfield_10030":null,
       "customfield_10031":null,
       "project":{
          "self":"https://zrolabs.atlassian.net/rest/api/2/project/10006",
          "id":"10006",
          "key":"COMPSUPCLI",
          "name":"Compliance Suporte",
          "projectTypeKey":"software",
          "simplified":false,
          "avatarUrls":{
             "48x48":"https://zrolabs.atlassian.net/rest/api/2/universal_avatar/view/type/project/avatar/10402",
             "24x24":"https://zrolabs.atlassian.net/rest/api/2/universal_avatar/view/type/project/avatar/10402?size=small",
             "16x16":"https://zrolabs.atlassian.net/rest/api/2/universal_avatar/view/type/project/avatar/10402?size=xsmall",
             "32x32":"https://zrolabs.atlassian.net/rest/api/2/universal_avatar/view/type/project/avatar/10402?size=medium"
          }
       },
       "customfield_10032":null,
       "customfield_10033":null,
       "aggregatetimespent":null,
       "customfield_10034":null,
       "customfield_10035":null,
       "resolutiondate":null,
       "workratio":-1,
       "watches":{
          "self":"https://zrolabs.atlassian.net/rest/api/2/issue/COMPSUPCLI-97/watchers",
          "watchCount":1,
          "isWatching":true
       },
       "issuerestriction":{
          "issuerestrictions":{
             
          },
          "shouldDisplay":false
       },
       "created":"2022-12-06T16:42:14.510-0300",
       "customfield_10020":null,
       "customfield_10021":null,
       "customfield_10022":null,
       "customfield_10023":null,
       "customfield_10024":null,
       "customfield_10025":null,
       "customfield_10016":null,
       "customfield_10017":null,
       "customfield_10018":{
          "hasEpicLinkFieldDependency":false,
          "showField":false,
          "nonEditableReason":{
             "reason":"PLUGIN_LICENSE_ERROR",
             "message":"The Parent Link is only available to Jira Premium users."
          }
       },
       "customfield_10019":"0|i00elr:",
       "updated":"2022-12-06T16:42:14.510-0300",
       "customfield_10093":null,
       "customfield_10094":null,
       "timeoriginalestimate":null,
       "customfield_10095":null,
       "customfield_10096":null,
       "description":null,
       "customfield_10097":null,
       "customfield_10010":null,
       "customfield_10014":null,
       "customfield_10015":null,
       "timetracking":{
          
       },
       "customfield_10005":null,
       "customfield_10006":null,
       "security":null,
       "customfield_10007":null,
       "customfield_10008":null,
       "attachment":[
          
       ],
       "customfield_10009":null,
       "summary":"teste do end-to end",
       "customfield_10080":null,
       "customfield_10081":null,
       "customfield_10082":null,
       "customfield_10083":null,
       "customfield_10084":null,
       "customfield_10085":null,
       "customfield_10086":"Para que a demanda seja finalizada em Downstream, ela precisa cumprir os tópicos elencados abaixo. Observe a legenda e aplique-a nos requisitos da Definition of Done(DoD):\r\n\r\n - Está OK!\r\n - Não está OK!\r\n - não se aplica!\r\n\r\n1. Estar em ambiente de Produção.\r\n2. Cumprir todos os critérios de aceite específicos.\r\n3. Ter passado por Code Review.\r\n4. Ter Passado por QA.\r\n5. Cumprir todos os critérios de aceite específicos.\r\n6. Ter sido aprovada no Teste Regressivo.",
       "customfield_10087":null,
       "customfield_10000":"{}",
       "customfield_10088":null,
       "customfield_10001":null,
       "customfield_10089":null,
       "customfield_10002":null,
       "customfield_10003":null,
       "customfield_10004":null,
       "environment":null,
       "duedate":null,
       "comment":{
          "comments":[
             
          ],
          "self":"https://zrolabs.atlassian.net/rest/api/2/issue/13324/comment",
          "maxResults":0,
          "total":0,
          "startAt":0
       }
    }
 }`,
};

export const updateFraudDetectionRequestIssueBodyRest = {
  description: 'Notification for update issue sent for Jira',
  example: `{
    "expand":"renderedFields,names,schema,operations,editmeta,changelog,versionedRepresentations,customfield_10042.properties,customfield_10010.requestTypePractice",
    "id":"13324",
    "self":"https://zrolabs.atlassian.net/rest/api/2/issue/13324",
    "key":"COMPSUPCLI-97",
    "fields":{
       "statuscategorychangedate":"2022-12-06T16:42:14.890-0300",
       "customfield_10070":null,
       "customfield_10071":null,
       "customfield_10072":null,
       "customfield_10073":null,
       "customfield_10074":null,
       "customfield_10075":null,
       "customfield_10076":null,
       "customfield_10077":null,
       "fixVersions":[
          
       ],
       "customfield_10078":null,
       "customfield_10079":null,
       "resolution":null,
       "lastViewed":"2022-12-06T16:43:33.950-0300",
       "customfield_10060":null,
       "customfield_10061":null,
       "customfield_10062":null,
       "customfield_10063":null,
       "customfield_10064":null,
       "customfield_10067":null,
       "priority":{
          "self":"https://zrolabs.atlassian.net/rest/api/2/priority/3",
          "iconUrl":"https://zrolabs.atlassian.net/images/icons/priorities/medium.svg",
          "name":"Medium",
          "id":"3"
       },
       "customfield_10068":null,
       "customfield_10069":null,
       "labels":[
          
       ],
       "aggregatetimeoriginalestimate":null,
       "timeestimate":null,
       "versions":[
          
       ],
       "issuelinks":[
          
       ],
       "assignee":null,
       "status":{
          "self":"https://zrolabs.atlassian.net/rest/api/2/status/1",
          "description":"The PIX infraction is new and is waiting creation approval",
          "iconUrl":"https://zrolabs.atlassian.net/images/icons/statuses/open.png",
          "name":"New",
          "id":"1",
          "statusCategory":{
             "self":"https://zrolabs.atlassian.net/rest/api/2/statuscategory/2",
             "id":2,
             "key":"new",
             "colorName":"blue-gray",
             "name":"To Do"
          }
       },
       "components":[
          
       ],
       "customfield_10051":null,
       "customfield_10052":null,
       "customfield_10053":null,
       "customfield_10054":null,
       "customfield_10055":null,
       "customfield_10056":null,
       "customfield_10057":null,
       "customfield_10058":null,
       "customfield_10059":null,
       "aggregatetimeestimate":null,
       "creator":{
          "self":"https://zrolabs.atlassian.net/rest/api/2/user?accountId=0",
          "accountId":"0",
          "emailAddress":"test@zrobank.com.br",
          "avatarUrls":{
             "48x48":"https://secure.gravatar.com/avatar/4b43e08add3c999a8cdf8e4864e9b7b8?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FMT-6.png",
             "24x24":"https://secure.gravatar.com/avatar/4b43e08add3c999a8cdf8e4864e9b7b8?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FMT-6.png",
             "16x16":"https://secure.gravatar.com/avatar/4b43e08add3c999a8cdf8e4864e9b7b8?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FMT-6.png",
             "32x32":"https://secure.gravatar.com/avatar/4b43e08add3c999a8cdf8e4864e9b7b8?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FMT-6.png"
          },
          "displayName":"Zro Tester",
          "active":true,
          "timeZone":"America/Recife",
          "accountType":"atlassian"
       },
       "subtasks":[
          
       ],
       "customfield_10040":"",
       "customfield_10041":0.0,
       "customfield_10042":null,
       "customfield_10043":null,
       "reporter":{
          "self":"https://zrolabs.atlassian.net/rest/api/2/user?accountId=0",
          "accountId":"0",
          "emailAddress":"test@zrobank.com.br",
          "avatarUrls":{
             "48x48":"https://secure.gravatar.com/avatar/4b43e08add3c999a8cdf8e4864e9b7b8?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FMT-6.png",
             "24x24":"https://secure.gravatar.com/avatar/4b43e08add3c999a8cdf8e4864e9b7b8?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FMT-6.png",
             "16x16":"https://secure.gravatar.com/avatar/4b43e08add3c999a8cdf8e4864e9b7b8?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FMT-6.png",
             "32x32":"https://secure.gravatar.com/avatar/4b43e08add3c999a8cdf8e4864e9b7b8?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FMT-6.png"
          },
          "displayName":"Zro Tester",
          "active":true,
          "timeZone":"America/Recife",
          "accountType":"atlassian"
       },
       "aggregateprogress":{
          "progress":0,
          "total":0
       },
       "customfield_10044":null,
       "customfield_10045":null,
       "customfield_10046":[
          
       ],
       "customfield_10038":null,
       "progress":{
          "progress":0,
          "total":0
       },
       "votes":{
          "self":"https://zrolabs.atlassian.net/rest/api/2/issue/COMPSUPCLI-97/votes",
          "votes":0,
          "hasVoted":false
       },
       "worklog":{
          "startAt":0,
          "maxResults":20,
          "total":0,
          "worklogs":[
             
          ]
       },
       "issuetype":{
          "self":"https://zrolabs.atlassian.net/rest/api/2/issuetype/10028",
          "id":"10028",
          "description":"Created warning transaction after analise transaction",
          "iconUrl":"https://zrolabs.atlassian.net/rest/api/2/universal_avatar/view/type/issuetype/avatar/10559?size=medium",
          "name":"Warning Transaction",
          "subtask":false,
          "avatarId":10559,
          "hierarchyLevel":0
       },
       "timespent":null,
       "customfield_10030":null,
       "customfield_10031":null,
       "project":{
          "self":"https://zrolabs.atlassian.net/rest/api/2/project/10006",
          "id":"10006",
          "key":"COMPSUPCLI",
          "name":"Compliance Suporte",
          "projectTypeKey":"software",
          "simplified":false,
          "avatarUrls":{
             "48x48":"https://zrolabs.atlassian.net/rest/api/2/universal_avatar/view/type/project/avatar/10402",
             "24x24":"https://zrolabs.atlassian.net/rest/api/2/universal_avatar/view/type/project/avatar/10402?size=small",
             "16x16":"https://zrolabs.atlassian.net/rest/api/2/universal_avatar/view/type/project/avatar/10402?size=xsmall",
             "32x32":"https://zrolabs.atlassian.net/rest/api/2/universal_avatar/view/type/project/avatar/10402?size=medium"
          }
       },
       "customfield_10032":null,
       "customfield_10033":null,
       "aggregatetimespent":null,
       "customfield_10034":null,
       "customfield_10035":null,
       "resolutiondate":null,
       "workratio":-1,
       "watches":{
          "self":"https://zrolabs.atlassian.net/rest/api/2/issue/COMPSUPCLI-97/watchers",
          "watchCount":1,
          "isWatching":true
       },
       "issuerestriction":{
          "issuerestrictions":{
             
          },
          "shouldDisplay":false
       },
       "created":"2022-12-06T16:42:14.510-0300",
       "customfield_10020":null,
       "customfield_10021":null,
       "customfield_10022":null,
       "customfield_10023":null,
       "customfield_10024":null,
       "customfield_10025":null,
       "customfield_10016":null,
       "customfield_10017":null,
       "customfield_10018":{
          "hasEpicLinkFieldDependency":false,
          "showField":false,
          "nonEditableReason":{
             "reason":"PLUGIN_LICENSE_ERROR",
             "message":"The Parent Link is only available to Jira Premium users."
          }
       },
       "customfield_10019":"0|i00elr:",
       "updated":"2022-12-06T16:42:14.510-0300",
       "customfield_10093":null,
       "customfield_10094":null,
       "timeoriginalestimate":null,
       "customfield_10095":null,
       "customfield_10096":null,
       "description":null,
       "customfield_10097":null,
       "customfield_10010":null,
       "customfield_10014":null,
       "customfield_10015":null,
       "timetracking":{
          
       },
       "customfield_10005":null,
       "customfield_10006":null,
       "security":null,
       "customfield_10007":null,
       "customfield_10008":null,
       "attachment":[
          
       ],
       "customfield_10009":null,
       "summary":"teste do end-to end",
       "customfield_10080":null,
       "customfield_10081":null,
       "customfield_10082":null,
       "customfield_10083":null,
       "customfield_10084":null,
       "customfield_10085":null,
       "customfield_10086":"Para que a demanda seja finalizada em Downstream, ela precisa cumprir os tópicos elencados abaixo. Observe a legenda e aplique-a nos requisitos da Definition of Done(DoD):\r\n\r\n - Está OK!\r\n - Não está OK!\r\n - não se aplica!\r\n\r\n1. Estar em ambiente de Produção.\r\n2. Cumprir todos os critérios de aceite específicos.\r\n3. Ter passado por Code Review.\r\n4. Ter Passado por QA.\r\n5. Cumprir todos os critérios de aceite específicos.\r\n6. Ter sido aprovada no Teste Regressivo.",
       "customfield_10087":null,
       "customfield_10000":"{}",
       "customfield_10088":null,
       "customfield_10001":null,
       "customfield_10089":null,
       "customfield_10002":null,
       "customfield_10003":null,
       "customfield_10004":null,
       "environment":null,
       "duedate":null,
       "comment":{
          "comments":[
             
          ],
          "self":"https://zrolabs.atlassian.net/rest/api/2/issue/13324/comment",
          "maxResults":0,
          "total":0,
          "startAt":0
       }
    }
 }`,
};
