# 获取最新消息（不带搜索）
## 请求标头（page=1代表第一页，limit=25指的是获取25个帖子；Authorization，Cookie，Uuid，X-XSRF-TOKEN均为账号认证信息（只有正确填写这四个值才能访问以账号访问北大树洞））（后续将只给出url，请求标头的其他部分与这个示例类似）：
GET /api/pku_hole?page=1&limit=25 HTTP/1.1
Accept: application/json, text/plain, */*
Accept-Encoding: gzip, deflate, br, zstd
Accept-Language: zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC90cmVlaG9sZS5wa3UuZWR1LmNuXC9jYXNfaWFhYV9sb2dpbiIsImlhdCI6MTc1MDYxMzgzNSwiZXhwIjoxNzUzMjA1ODM1LCJuYmYiOjE3NTA2MTM4MzUsImp0aSI6InpmYnlacGczYndmWFRFZG8iLCJzdWIiOiIyNDAwMDEzMTA2IiwicHJ2IjoiMjNiZDVjODk0OWY2MDBhZGIzOWU3MDFjNDAwODcyZGI3YTU5NzZmNyJ9.KHHJl1VeEA_hibWHR5vCPR_tNj7sCAj30WjS525BIv0
Connection: keep-alive
Cookie: UM_distinctid=1970ce980f081b-0cd6b92b4224d88-4c657b58-146d15-1970ce980f120be; pku_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC90cmVlaG9sZS5wa3UuZWR1LmNuXC9jYXNfaWFhYV9sb2dpbiIsImlhdCI6MTc1MDYxMzgzNSwiZXhwIjoxNzUzMjA1ODM1LCJuYmYiOjE3NTA2MTM4MzUsImp0aSI6InpmYnlacGczYndmWFRFZG8iLCJzdWIiOiIyNDAwMDEzMTA2IiwicHJ2IjoiMjNiZDVjODk0OWY2MDBhZGIzOWU3MDFjNDAwODcyZGI3YTU5NzZmNyJ9.KHHJl1VeEA_hibWHR5vCPR_tNj7sCAj30WjS525BIv0; XSRF-TOKEN=eyJpdiI6Ik54emlhdGNTNm1XakhvaTkyeDk5b3c9PSIsInZhbHVlIjoiMmVSem5OSjVGSDJaRFR4OGIzSVEzM0szT2xPZTlybGFaYTZrMG5BNlVNakN1Z2c4RXdiUkpyczlIaHAyWGQydmJNbzU1dVVnUlZneG1EN1ViaGV1R2xNQ2pqRElUS2preFRQT1liNDJBV0QxaVJ5bTBSOGdXVmx3SnEyNVpFT0IiLCJtYWMiOiI4YmM0ODg4YmZlZTM5YmNhMDQxZmQ1ZmJjOTdhOGYxYzA0OGYwYmE3NDA3OWQzNGRiYmE4ZDM1MWQ1OTRjZmRjIn0%3D; _session=eyJpdiI6InNueVN2K1ZCcng5UmdIMmw2bkN6eHc9PSIsInZhbHVlIjoia0dheDFSWDNHaS80TndpcjZzYWdLUWNOdTFKeFdacWRSUlFuMnJHemFXM3ZuUWpYaitoTkc1b3VCeEFYUEtoWnZEYThRbDlLaUlIY0gxVnROOFEzV09yR25lUE9Xbm9OWGZCYURQQVNub3NDMmlGVE1xaldZZTZTRCtsWWxzcHkiLCJtYWMiOiI4YzFlMjMxMzU4ZGNiMzIzYjY1M2JhMTlmMWIzNTk2YjcyMDZjOGRlMGE3ZjRjODU2NzRhNzZhNTQzNTlhYjUxIn0%3D
DNT: 1
Host: treehole.pku.edu.cn
Referer: https://treehole.pku.edu.cn/web/
Sec-Fetch-Dest: empty
Sec-Fetch-Mode: cors
Sec-Fetch-Site: same-origin
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0
Uuid: Web_PKUHOLE_2.0.0_WEB_UUID_a0ec3813-3eb2-44a0-9b18-fef9bb105803
X-XSRF-TOKEN: eyJpdiI6Ik54emlhdGNTNm1XakhvaTkyeDk5b3c9PSIsInZhbHVlIjoiMmVSem5OSjVGSDJaRFR4OGIzSVEzM0szT2xPZTlybGFaYTZrMG5BNlVNakN1Z2c4RXdiUkpyczlIaHAyWGQydmJNbzU1dVVnUlZneG1EN1ViaGV1R2xNQ2pqRElUS2preFRQT1liNDJBV0QxaVJ5bTBSOGdXVmx3SnEyNVpFT0IiLCJtYWMiOiI4YmM0ODg4YmZlZTM5YmNhMDQxZmQ1ZmJjOTdhOGYxYzA0OGYwYmE3NDA3OWQzNGRiYmE4ZDM1MWQ1OTRjZmRjIn0=
sec-ch-ua: "Microsoft Edge";v="137", "Chromium";v="137", "Not/A)Brand";v="24"
sec-ch-ua-mobile: ?0
sec-ch-ua-platform: "Windows"

## 响应（"from": 1和"to": 25代表返回了最新的第1到第25个帖子，"total": 7194786代表共有7194786个帖子；"last_page": 287792代表共有287792页（每页的帖子数量为"per_page"）；"timestamp"是unix时间戳；在data的每一个项下，"pid"代表帖子的ID，"text"代表帖子的第一条消息（主贴）的内容，"timestamp"代表消息发送的时间戳，"likenum": 代表被收藏数，"reply"代表回复数（即帖子中不包含第一条消息在内的消息总数），label代表该帖子的标签：label的范围为1-4，1:课程心得，2:失物招领，3:求职经历，4:跳蚤市场）：
```json
{
    "code": 20000,
    "data": {
        "current_page": 1,
        "data": [
            {
                "pid": 7481846,
                "text": "#7481320\r\n顶一下！欢迎大家来～",
                "type": "text",
                "timestamp": 1750779219,
                "reply": 0,
                "likenum": 1,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7481845,
                "text": "话说北大cs本硕会在面试时被少拷打一点或者稍微优待吗。。。 dz最近面了几个大厂感觉根本无关学历出身，到了面试就是拷打",
                "type": "text",
                "timestamp": 1750779216,
                "reply": 0,
                "likenum": 1,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7481844,
                "text": "6412551\r\n你北招生组也并非都是什么好东西\r\n特别是某小地方这几年换了招生老师之后\r\n从来都不想去招生组昧着良心做事",
                "type": "text",
                "timestamp": 1750779191,
                "reply": 1,
                "likenum": 1,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7481843,
                "text": "清华的人工智能学院是什么性质呀，是独立的书院还是相当于分流之后的选择\r\n#招生 清华",
                "type": "text",
                "timestamp": 1750779176,
                "reply": 0,
                "likenum": 1,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7481842,
                "text": "出欲非舞室卡，挣扎了半年，实在是没空去了。还有29次，一次2个小时，今年11.25到期。当时2300买的30次，用了1次，2000出剩下的29次，可刀\nwx：syr3511699728",
                "type": "image",
                "timestamp": 1750779171,
                "reply": 1,
                "likenum": 1,
                "extra": 245015,
                "anonymous": 1,
                "is_top": 0,
                "label": 4,
                "status": 0,
                "is_comment": 1,
                "tag": null,
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    1080,
                    1920
                ],
                "label_info": {
                    "id": 4,
                    "tag_name": "跳蚤市场",
                    "is_delete": 0,
                    "created_at": null,
                    "updated_at": null
                }
            },
            {
                "pid": 7481841,
                "text": "宿舍楼里有个小孩长得好可爱😋",
                "type": "text",
                "timestamp": 1750779137,
                "reply": 0,
                "likenum": 1,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7481839,
                "text": "出全新华为二代笔尖，原厂\r\n20r？我不太确定，贵太多了的话可刀",
                "type": "text",
                "timestamp": 1750779133,
                "reply": 0,
                "likenum": 1,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7481838,
                "text": "在小蓝上又被夸帅了 嘻嘻\n",
                "type": "text",
                "timestamp": 1750779096,
                "reply": 1,
                "likenum": 2,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7481837,
                "text": "好想和kpop人扩列……朋友圈里都没有同好 好难受",
                "type": "text",
                "timestamp": 1750779084,
                "reply": 0,
                "likenum": 1,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7481836,
                "text": "求问万洞：学年论文导师评阅表上除了导师签名\/打分\/评语的内容，是直接打印好，还是打印空白表格以后手写呀",
                "type": "text",
                "timestamp": 1750779082,
                "reply": 0,
                "likenum": 1,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7481835,
                "text": "刚谈恋爱就不想谈了 洞友建议分了还是忍着",
                "type": "text",
                "timestamp": 1750779080,
                "reply": 4,
                "likenum": 4,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7481833,
                "text": "求问万洞：\r\n洛书和诚奇选哪个\r\n万分感谢了呜呜呜呜呜\r\n\r\n#sms #量化 #投资 #百亿私募 #cq #金融 #大数据 #物院wy",
                "type": "text",
                "timestamp": 1750779046,
                "reply": 0,
                "likenum": 1,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7481832,
                "text": "求问大家🥺现在暑假热水是到几点呢，dz以为过了期末22号就会变回10点50分，可是刚刚过了11点还有热水🤔",
                "type": "text",
                "timestamp": 1750779012,
                "reply": 2,
                "likenum": 3,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7481831,
                "text": "popi 准备夏令营中😇",
                "type": "text",
                "timestamp": 1750778997,
                "reply": 4,
                "likenum": 4,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7481830,
                "text": "出京东京造 分离乳清蛋白粉\r\n全新 没打开过\r\n原价249 现200出\r\n留号我加你\r\n",
                "type": "image",
                "timestamp": 1750778990,
                "reply": 0,
                "likenum": 1,
                "extra": 578508,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": null,
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    1148,
                    1920
                ],
                "label_info": null
            },
            {
                "pid": 7481829,
                "text": "明天招生不是招生组的可以去凑热闹吗\r\n",
                "type": "text",
                "timestamp": 1750778960,
                "reply": 0,
                "likenum": 1,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7481827,
                "text": "有没有在辽宁招生的朋友，今年大连高考的成绩怎么样呢？",
                "type": "text",
                "timestamp": 1750778858,
                "reply": 0,
                "likenum": 1,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7481826,
                "text": "有无uu想去6.28张家口天漠音乐节！有万青、痛仰，dz很喜欢万青！蹲蹲搭子！",
                "type": "text",
                "timestamp": 1750778829,
                "reply": 0,
                "likenum": 1,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7481825,
                "text": "有没有人要2024年注会复习资料税法，财管会计，全新没动，免费送",
                "type": "image",
                "timestamp": 1750778798,
                "reply": 0,
                "likenum": 1,
                "extra": 151458,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": null,
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    1080,
                    1078
                ],
                "label_info": null
            },
            {
                "pid": 7481824,
                "text": "日语写作给分好差。。",
                "type": "text",
                "timestamp": 1750778791,
                "reply": 0,
                "likenum": 1,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7481823,
                "text": "舍敌你能不能不要一直按笔aaaaaaaaaa滚滚滚",
                "type": "text",
                "timestamp": 1750778774,
                "reply": 2,
                "likenum": 1,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7481820,
                "text": "求问27号名额约满了还有什么方式入校吗",
                "type": "text",
                "timestamp": 1750778731,
                "reply": 0,
                "likenum": 1,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7481819,
                "text": "好奇学校有哪个社团有缝纫机吗，有没有这样做手工的社团",
                "type": "text",
                "timestamp": 1750778717,
                "reply": 6,
                "likenum": 5,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7481818,
                "text": "历史社会学 历社\n老师有提过趋势书评是什么吗😢或者这个读书报告该咋写，，",
                "type": "text",
                "timestamp": 1750778716,
                "reply": 1,
                "likenum": 1,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7481817,
                "text": "出全身镜，20r，40x150m的\n可放地上可挂门后",
                "type": "image",
                "timestamp": 1750778702,
                "reply": 1,
                "likenum": 1,
                "extra": 119976,
                "anonymous": 1,
                "is_top": 0,
                "label": 4,
                "status": 0,
                "is_comment": 1,
                "tag": null,
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    400,
                    400
                ],
                "label_info": {
                    "id": 4,
                    "tag_name": "跳蚤市场",
                    "is_delete": 0,
                    "created_at": null,
                    "updated_at": null
                }
            }
        ],
        "first_page_url": "http:\/\/treehole.pku.edu.cn\/api\/pku_hole?page=1",
        "from": 1,
        "last_page": 287792,
        "last_page_url": "http:\/\/treehole.pku.edu.cn\/api\/pku_hole?page=287792",
        "next_page_url": "http:\/\/treehole.pku.edu.cn\/api\/pku_hole?page=2",
        "path": "http:\/\/treehole.pku.edu.cn\/api\/pku_hole",
        "per_page": "25",
        "prev_page_url": null,
        "to": 25,
        "total": 7194786
    },
    "message": "success",
    "success": true,
    "timestamp": 1750779223
}
```

# 获取一个帖子的第一条消息（主贴）和该帖子的其他基本信息
## 请求url（pid代表帖子ID）
https://treehole.pku.edu.cn/api/pku_hole?pid=7481883

## 响应（"type"代表内容类型，如果是"text"代表是纯文本，如果是"image"则代表有一张图片也可能有文本）
```json
{
    "code": 20000,
    "data": {
        "current_page": 1,
        "data": [
            {
                "pid": 7481883,
                "text": "女朋友说很忙但转眼和别人一起去吃饭了。。有点不能理解",
                "type": "text",
                "timestamp": 1750779871,
                "reply": 7,
                "likenum": 4,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            }
        ],
        "first_page_url": "http:\/\/treehole.pku.edu.cn\/api\/pku_hole?page=1",
        "from": 1,
        "last_page": 1,
        "last_page_url": "http:\/\/treehole.pku.edu.cn\/api\/pku_hole?page=1",
        "next_page_url": null,
        "path": "http:\/\/treehole.pku.edu.cn\/api\/pku_hole",
        "per_page": 15,
        "prev_page_url": null,
        "to": 1,
        "total": 1
    },
    "message": "success",
    "success": true,
    "timestamp": 1750780140
}
```
**再给一个例子**
```json
{
    "code": 20000,
    "data": {
        "pid": 7481910,
        "text": "出茶吧机 饮水机！\n含一个保温壶，使用不到一年，外观功能都很好，可以烧开水喝\n75r可刀\n#闲置 跳蚤市场 毕业",
        "type": "image",
        "timestamp": 1750780499,
        "reply": 0,
        "likenum": 1,
        "extra": 66815,
        "anonymous": 1,
        "url": "2025\/6\/24\/22dadbd7be1760a4b3964639314ccde91d875387_400x400.jpeg",
        "is_top": 0,
        "label": 4,
        "status": 0,
        "is_comment": 1,
        "tag": null,
        "is_follow": 0,
        "image_size": [
            400,
            400
        ],
        "label_info": {
            "id": 4,
            "tag_name": "跳蚤市场",
            "is_delete": 0,
            "created_at": null,
            "updated_at": null
        },
        "bookmark": null
    },
    "message": "success",
    "success": true,
    "timestamp": 1750780642
}
```

# 获取一个帖子的回复（除了第一条消息之外的其他消息）
## 请求url（page=1表示第一页，limit=15表示每页最多15个回复（即第1到第15个回复）sort=asc代表按照时间戳升序排列，若要逆序则改为sort=desc）
https://treehole.pku.edu.cn/api/pku_comment_v3/7481883?page=1&limit=15&sort=asc

## 响应（注意：回复只有回复文字，不能回复图片，cid代表回复的ID，name你可以理解为回复者的身份标识，每个回复者的身份标识按照首次发帖顺序（时间戳）依次分配为Alice, Bob, Carol, Dave, ...（按照英文名的首字母顺序给出，当回复人数超过26人时，第27人的身份标识为Angry Alice, 下一个为Angry Bob，以此类推）（在同一个帖子下的同一个人在回复时的身份标识相同，但由于树洞的匿名性，我们无法从身份标识推测回复者的真实身份，也不可能据此推测在其他帖子下的回复者的身份，因为不同帖子下的Alice大概率不是同一个人）。另外，对于第一个消息（主贴）的发送者，其在该帖子下的身份标识为"洞主"，若其在该帖子下发送回复，则身份标识为"洞主"）
```json
{
    "code": 20000,
    "data": {
        "current_page": 1,
        "data": [
            {
                "cid": 34359052,
                "pid": 7481883,
                "text": "我给的",
                "timestamp": 1750779914,
                "tag": null,
                "comment_id": null,
                "name": "Alice",
                "quote": null
            },
            {
                "cid": 34359053,
                "pid": 7481883,
                "text": "任务罢了",
                "timestamp": 1750779920,
                "tag": null,
                "comment_id": 34359052,
                "name": "Alice",
                "quote": {
                    "pid": 7481883,
                    "text": "我给的",
                    "name_tag": "Alice"
                }
            },
            {
                "cid": 34359056,
                "pid": 7481883,
                "text": "emmm，可能吃饭算作公务？）",
                "timestamp": 1750779933,
                "tag": null,
                "comment_id": null,
                "name": "Bob",
                "quote": null
            },
            {
                "cid": 34359069,
                "pid": 7481883,
                "text": "忙也不能不吃饭吧",
                "timestamp": 1750779980,
                "tag": null,
                "comment_id": null,
                "name": "Carol",
                "quote": null
            },
            {
                "cid": 34359078,
                "pid": 7481883,
                "text": "是出去聚餐。。",
                "timestamp": 1750780011,
                "tag": null,
                "comment_id": null,
                "name": "洞主",
                "quote": null
            },
            {
                "cid": 34359083,
                "pid": 7481883,
                "text": "什么的聚餐 社团的聚餐有时候就是忙的原因之一吧",
                "timestamp": 1750780044,
                "tag": null,
                "comment_id": null,
                "name": "Dave",
                "quote": null
            },
            {
                "cid": 34359099,
                "pid": 7481883,
                "text": "可能也是没办法推脱的聚餐，也会很伤神的",
                "timestamp": 1750780107,
                "tag": null,
                "comment_id": null,
                "name": "Carol",
                "quote": null
            }
        ],
        "first_page_url": "http:\/\/treehole.pku.edu.cn\/api\/pku_comment_v3\/7481883?page=1",
        "from": 1,
        "last_page": 1,
        "last_page_url": "http:\/\/treehole.pku.edu.cn\/api\/pku_comment_v3\/7481883?page=1",
        "next_page_url": null,
        "path": "http:\/\/treehole.pku.edu.cn\/api\/pku_comment_v3\/7481883",
        "per_page": "15",
        "prev_page_url": null,
        "to": 7,
        "total": 7
    },
    "message": "success",
    "success": true,
    "timestamp": 1750780140
}
```

# 获取帖子的图片（如果该帖子的主贴包含图片），注意，一个帖子最多有一张图片
## 请求url（7481910为帖子的pid）
https://treehole.pku.edu.cn/api/pku_image/7481910

## 响应
图片内容

# 根据关键词和标签搜索树洞
## 请求url（keyword=的内容为搜索关键词，label的范围为1-4，1:课程心得，2:失物招领，3:求职经历，4:跳蚤市场，keyword和label其实都是可选的，在这两个都不填写的情况下，就变成了直接获取最新消息）
https://treehole.pku.edu.cn/api/pku_hole?page=1&limit=25&keyword=%E9%AB%98%E6%95%B0&label=1

## 响应
```json
{
    "code": 20000,
    "data": {
        "current_page": 1,
        "data": [
            {
                "pid": 7477491,
                "text": "7477438 忘记加关键词了 数位板 手绘板 画画",
                "type": "text",
                "timestamp": 1750654260,
                "reply": 0,
                "likenum": 1,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7473941,
                "text": "来几个你常搜的树洞检索关键词",
                "type": "text",
                "timestamp": 1750525315,
                "reply": 8,
                "likenum": 5,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7473922,
                "text": "很久没搜本院系相关的洞了，因为一年前在一条关于是否是保研好去处的洞内有过不太愉快的争论，当时回复完就取关了。没想到刚刚因为院系关键词，又在其他洞里看到被捞出来批判，点进去看到了后续的几条指责，有点小小的惆怅。唉",
                "type": "text",
                "timestamp": 1750524826,
                "reply": 2,
                "likenum": 2,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7472523,
                "text": "【收】收收收2-3个带滚轮的大号收纳箱 最好透明 自提 蹲好价\nv Claudia_EL\n\n关键词：收纳箱\/收纳",
                "type": "image",
                "timestamp": 1750494203,
                "reply": 0,
                "likenum": 1,
                "extra": 97589,
                "anonymous": 1,
                "is_top": 0,
                "label": 4,
                "status": 0,
                "is_comment": 1,
                "tag": null,
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    1200,
                    1286
                ],
                "label_info": {
                    "id": 4,
                    "tag_name": "跳蚤市场",
                    "is_delete": 0,
                    "created_at": null,
                    "updated_at": null
                }
            },
            {
                "pid": 7467033,
                "text": "我的期末关键词：漫威，盾冬，铁虫，TSN\/ME\r\n看同人文看的不知天地为何物了",
                "type": "text",
                "timestamp": 1750345267,
                "reply": 6,
                "likenum": 2,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7465407,
                "text": "古文史一  \r\n绝望的dz正在上演：\r\n打开书：马冬梅\r\n合上书：马什么梅？什么冬梅？马东什么？\r\n\r\n我真的完了。其他课还可以速记关键词然后自己串逻辑瞎编，诗词这种要求每个字都精确记忆的根本抱不了佛脚啊啊啊啊啊啊啊啊",
                "type": "text",
                "timestamp": 1750319547,
                "reply": 6,
                "likenum": 1,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7464193,
                "text": "编辑了一顿文案，发现总显示文案里有关键词发不出去\n那我就文明点，这些游客来学校里作妖不是一次两次了：没锁的车就到处乱骑给人骑校外去、往未名湖喷泉里撒尿、图书馆草坪旁边拉屎\n你北管不了就别放进来这些标子洋的玩意行吗\n大学是学习的地方 不是旅游景点",
                "type": "image",
                "timestamp": 1750299469,
                "reply": 8,
                "likenum": 4,
                "extra": 220536,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": null,
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    867,
                    1920
                ],
                "label_info": null
            },
            {
                "pid": 7464086,
                "text": "发现一件恐怖的事情，搜索关键词最多只能看到21年6月之后的内容，以前收藏的更早的洞也没了，不会树洞现在只能看到最近4年的贴了吧！！",
                "type": "text",
                "timestamp": 1750297042,
                "reply": 7,
                "likenum": 0,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7461577,
                "text": "树洞是真的很能传播焦虑。。。\r\n看着88、89的分数非常满意，然后一搜课程关键词天塌了\r\n有好多比我分高好多还在哭天抢地的啊😭😭",
                "type": "text",
                "timestamp": 1750236243,
                "reply": 11,
                "likenum": 3,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7460899,
                "text": "求问万洞啊啊啊啊 之前一直有个模糊印象是有门课会到石舫上（似乎是外院？）\n\n但查了很多关键词后都没有找到😭😭请问有uu知道或上过吗🥺\n\n感恩！顺祝绩点高高！",
                "type": "text",
                "timestamp": 1750226730,
                "reply": 2,
                "likenum": 3,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7460605,
                "text": "叶炜老师 王竣助教 这里是树洞自搜指南\r\n关键词可以搜yw 中古史上 中国古代史上 叶炜\r\n其实一学期下来收获满满，也不应该太过纠结最后这个成绩，但是在这个大环境下，绩点有时候真的很重要，4学分真的很拉绩点",
                "type": "text",
                "timestamp": 1750222006,
                "reply": 24,
                "likenum": 9,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7458963,
                "text": "想请问一下气象气候学答题要写到什么程度呢？可以就像老师的ppt一样只写要点关键词吗？\r\n#城环 #自然地理",
                "type": "text",
                "timestamp": 1750175576,
                "reply": 0,
                "likenum": 0,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7455814,
                "text": "fy 中法史 zym\r\n真的背不完了，背完就忘wwwwwww啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊\r\n只背ppt上的关键词，上考场口胡行吗\r\n",
                "type": "text",
                "timestamp": 1750128299,
                "reply": 4,
                "likenum": 4,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7454670,
                "text": "有人记得社科方 ccw的题吗 怎么一个都记不起来 记得关键词也可以",
                "type": "text",
                "timestamp": 1750085558,
                "reply": 0,
                "likenum": 2,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7454294,
                "text": "统一回复[玫瑰]\r\n1.本课程平均分四舍五入86，已远超往日规定优秀率。\r\n2、评分标准由老师制定，分心得一、心得二、期末三项作业，出勤分数在期末作业项加减（大部分同学都是满勤）。每项作业由一位助教负责，三项合并，所以评分是完全公正的，大家都是同一起跑线。最终成绩由彭锋老师亲自审核。\r\n3、具体的评分标准，如彭老师所要求，是“心得”而非“习作”或个人见解生发，好的心得体会要有课堂内容的结合、升华。这其中几种典型情况：（1）、与课堂内容、体会无关（通篇甚至没有老师的名字或者老师ppt上的关键词）（2）、挪用其他课程的作业，典型的是：提到了xx概念（并不核心），很用来适合分析xx现象（以下内容挪用其他作业）（3）明显AI生成，如文内写到了“主讲人生动地讲述了XXX”诸如此类。\r\n4、非常理解同学们对评分的关注，课程的三项作业都是主观性的，老师和助教已经尽可能的避免主观色彩（比如一项作业由1人专门负责），同学们也可互相比对，借鉴高分作业，为以后的学习增加经验，祝大家学习顺利。[玫瑰][玫瑰]\r\n\r\n感谢老师们和助教老师们一学期的辛苦付出！[玫瑰][玫瑰][玫瑰]",
                "type": "text",
                "timestamp": 1750080052,
                "reply": 30,
                "likenum": 15,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7446257,
                "text": "请问社心写文献综述需要摘要和关键词吗",
                "type": "text",
                "timestamp": 1749891313,
                "reply": 2,
                "likenum": 2,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7442258,
                "text": "有无洞友有学校附近普拉提馆推荐，或者可以出一两节让我试试的，搜了下关键词好像都是几个月前出课的友友了呜呜呜呜",
                "type": "text",
                "timestamp": 1749796936,
                "reply": 10,
                "likenum": 4,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7442153,
                "text": "赛艇上找美国政治与公共政策\/美政公资料该搜什么关键词呀",
                "type": "text",
                "timestamp": 1749794310,
                "reply": 2,
                "likenum": 2,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7440700,
                "text": "马原能背多少是多少，多记关键词，剩下口胡😴",
                "type": "text",
                "timestamp": 1749746553,
                "reply": 0,
                "likenum": 0,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7440326,
                "text": "习惯半背半口糊最后成绩会怎么样呢\n就是只记关键词，自己努力串成整句话\ndz文科生，口糊能力应该尚可（？\n",
                "type": "text",
                "timestamp": 1749740197,
                "reply": 1,
                "likenum": 1,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7440082,
                "text": "理科生 习概完全不背熟 就是记关键词然后口胡 期末卷面能有及格吗🥲",
                "type": "text",
                "timestamp": 1749736195,
                "reply": 3,
                "likenum": 3,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7439410,
                "text": "本部附近租房指南（个人版）：\r\n前言：我在本部附近租过几次房，积累了一些经验，分享给大家。当然经验不免有一些bias，所以大家斟酌着看。\r\n\r\n一、租房渠道\r\n一般来说，BBS上有一个房屋租赁板块，上面有很多中介或者房东会发布帖子。\r\n小红书上可以搜地点然后加关键词（如，稻香园 房东直租），然后直接联系发帖人。小红书是找房东直租最有效的方式。\r\n以及一些微信群。\r\n\r\n二、租房的钱\r\n房东直租，押三付一。\r\n中介要收中介费。注意，这里可以谈打折，黑心中介收一个月的房租，一般中介是房租的8折，比较良心是6折。这个折扣跟房子的性价比有关，性价比越高，折扣越不容易拿到。\r\n再次注意：更黑心的中介，会在续租的时候再收你一道中介费，比如在这里点名一家稻香园附近的中介：北京隆恒住房租赁有限公司，办公地址在港沟南小区附近，转账显示姚强，公司是姚立飞名下。我只能主观的说一句，避雷，爱信不信。\r\n这个黑心程度，是我小红书上找的中介和其他中介给我说的，连中介都觉得黑心。所以一定要问清楚，续租要不要中介费！签约的时候，最好和房东签约，不然中介反悔再收中介费，连个办法都没。\r\n有可能会有2元\/天的维修费，网费水费电费\r\n\r\n\r\n\r\n三、房子怎么看，几条经验\r\n1、去看房的时候，最好选择下午2点左右，这个时候是光线最好的时候，如果这个时候采光都不行，那说明是真不行。手机上指南针看一下朝向，最好是朝南，阳光更丰富。\r\n2、带上尺子，量一下面积大小，方便给之后安排家具规划。\r\n3、看一下卫生间，是不是干净，这个是考验合租室友的时候了。顺便问问有没有中介公司的保洁每个月打扫公共区域（这里推荐京东保洁，咸鱼买30元2小时）。看一下热水器容量，60L以上或者燃气热水器最好，合租如果轮流洗澡容易热水不够用（燃气热水器则不用考虑这个问题）。然后打开花洒看一下出水大不大，这个是洗澡舒适度的评价标准，出水小容易洗的不爽。\r\n4、看一下厨房，合租室友的东西是不是摆的乱七八糟。看看有没有虫子在爬，厨房是虫子重灾区！！因为租户一轮一轮来来去去，很多遗留在厨房的东西不会被清理走，然后会生虫子，所以如果决定入住，搬进去之后一定要让中介把厨房打扫干净，除虫！\r\n5、看看周边设置。打开外卖软件，看看外卖有多少，距离咋样（实际上北大附近2公里内的房子，外卖跟北大差不多）；看看楼下垃圾桶的位置、便民超市的位置，附近地铁站的位置等等。\r\n6、噪音问题。如果窗户外面是临街且楼层低于4层，就要看车流量是不是很大了，如果大的话，早晚高峰就会吵了。但是如果靠近小区内部就还好。\r\n7、电梯问题。4层以下不用考虑，4层以上最好带电梯。\r\n8、隔音效果。把手机放在室内录音，然后关上房间门说话，看看能不能录音到。或者让中介出门说话，你在室内能不能听到。以及合租室友房间说话你能不能听到。\r\n9、避开大厂房补区。如果不是因为实习，避开他们。\r\n10、即使房子在地铁站附近，通勤依然是一件麻烦事情，因为从家走到地铁站，再从地铁站走到上车点，也是一笔时间开销。最好是骑车通勤15分钟左右。\r\n11、问清楚电费是多少一度，水费多少一吨。然后看清楚房间里面的电器功耗。一般电费都是自己去支付宝上直接缴费，所以不太会有被房东坑差额。\r\n12、家电维修情况。因为一般交了维修费，所以有什么损坏都是叫中介\/房东来修，要问清楚他们的维修范围，哪些能修，哪些不能修。以及坏了多少时间能修好。\r\n\r\n\r\n四、价格谈判\r\n中介的话术总是那一套：这个房子很火，已经有很多人来看过了，你不签很快就被别人签走了。但其实还好，都是话术，你可以多看几家中介再决定。\r\n然后你在看到心意的房子的时候，千万别表现出比较满意这种表情，脸上要用挑刺的眼光看，不然被宰了都不知道。\r\n往下砍价，砍个100-200块钱一般不是问题，特别是你要租一年的情况。如果不肯降，除非是真的看中了，大可扭头就走。\r\n\r\n先写这些，之后想起来再补充。\r\n",
                "type": "text",
                "timestamp": 1749725363,
                "reply": 13,
                "likenum": 88,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7438693,
                "text": "好的，根据你提供的《思想道德与法治》课程思考题和历年真题，我为你整理了一份高度浓缩的押题预测。本次押题严格遵循**高频考点、重点思考题、新增热点**的原则，只提供题干，供你进行针对性背诵。\r\n\r\n---\r\n\r\n### **《思想道德与法治》期末考试核心预测题**\r\n\r\n**（一）简答题高频预测**\r\n\r\n1.  简述理想信念为什么是精神之“钙”。\r\n2.  简述社会主义核心价值观的显著特征。\r\n3.  简述道德的社会作用。\r\n4.  简述我国社会主义法律的本质特征。\r\n5.  简述伟大建党精神的基本内涵。\r\n6.  简述法治思维的基本内容。\r\n7.  简述中华优秀传统美德的基本精神。\r\n8.  简述中国革命道德的主要内容。\r\n\r\n**（二）论述与材料分析题核心主题预测**\r\n\r\n**预测主题一：青年的理想与人生价值**\r\n* 从个人理想与社会理想辩证关系的角度，谈谈青年一代为什么要树立共同理想和远大理想。\r\n* 结合实际，谈谈新时代大学生应如何成就出彩人生？\r\n* 青年学生如何弘扬改革创新精神，做改革创新的生力军？\r\n\r\n**预测主题二：法治与德治的结合**\r\n* 谈谈你对“依法治国和以德治国相结合”这一原则的理解。\r\n* 如何理解法律上的权利与义务的辩证统一关系？\r\n* 结合实际，谈谈大学生应如何提升自身的法治素养。\r\n\r\n**预测主题三：爱国主义与宪法权威**\r\n* 结合实际，谈谈新时代大学生如何做忠诚的爱国者？\r\n* 如何理解我国宪法是国家的“根本法”，具有最高的法律地位？\r\n* 为什么说我国社会主义法律是党的主张和人民意志的共同体现？\r\n\r\n---\r\n\r\n**复习建议：**\r\n* **优先背诵：** 优先掌握上述所有题目的要点。简答题力求要点齐全、关键词准确。论述题需要有逻辑地组织答案，并能（在考场上）结合材料进行简单阐述。\r\n* **关注交叉点：** “理想信念”与“人生价值”、“法律”与“道德”是每年都极高概率出现的交叉考点，务必融会贯通。\r\n* **沉着应考：** 材料分析题的材料通常是引子，核心答案仍然来自教材知识点。审清题目，将问题与背诵的知识点挂钩即可。\r\n\r\n祝你考试顺利，取得优异成绩！",
                "type": "text",
                "timestamp": 1749713722,
                "reply": 0,
                "likenum": 1,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7436580,
                "text": "我笑了\r\n昨天和一个学弟聊天，对方喊我姐姐，我问他你怎么知道我是姐姐\r\n昨天是真对他没啥印象，加上对他的备注还是他自己的昵称，我还以为我俩只是机缘巧合加上但是列表躺尸不知道对方真实身份的那种\r\n结果刚才搜索关键词找人，跳出来的其中一个是他，才水灵灵地发现刚加的时候双方就对称过姓名年级院系了。。。\r\n有种淡淡的幽默感\r\n备注已改，人已老实\r\n",
                "type": "text",
                "timestamp": 1749652088,
                "reply": 1,
                "likenum": 1,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            },
            {
                "pid": 7436194,
                "text": "第一题不记得口胡的，但是按逻辑也口胡出来党的领导，主权统一这些关键词了，这种情况会给一点仁慈的分数吗💔",
                "type": "text",
                "timestamp": 1749645716,
                "reply": 0,
                "likenum": 1,
                "extra": 0,
                "anonymous": 1,
                "is_top": 0,
                "label": 0,
                "status": 0,
                "is_comment": 1,
                "tag": "",
                "is_follow": 0,
                "is_protect": 0,
                "image_size": [
                    0,
                    0
                ],
                "label_info": null
            }
        ],
        "first_page_url": "http:\/\/treehole.pku.edu.cn\/api\/pku_hole?page=1",
        "from": 1,
        "last_page": 94,
        "last_page_url": "http:\/\/treehole.pku.edu.cn\/api\/pku_hole?page=94",
        "next_page_url": "http:\/\/treehole.pku.edu.cn\/api\/pku_hole?page=2",
        "path": "http:\/\/treehole.pku.edu.cn\/api\/pku_hole",
        "per_page": "25",
        "prev_page_url": null,
        "to": 25,
        "total": 2341
    },
    "message": "success",
    "success": true,
    "timestamp": 1750782038
}
```

# 获取本人（即账号使用者）关注的帖子
## 请求url
https://treehole.pku.edu.cn/api/follow_v2?page=1&limit=25

## 响应
与之前的获取最新帖子格式完全一样

# 获取本人（即账号使用者）关注的帖子的所有分组类别（即账号可以将自己关注的帖子加入各种自己创建的分组中）
## 请求url
https://treehole.pku.edu.cn/api/bookmark
## 响应
```json
{
    "code": 20000,
    "data": [
        {
            "id": 2518,
            "bookmark_name": "信息贴"
        },
        {
            "id": 2519,
            "bookmark_name": "往年题"
        },
        {
            "id": 2520,
            "bookmark_name": "跳蚤市场"
        },
        {
            "id": 2521,
            "bookmark_name": "课程测评"
        },
        {
            "id": 2691,
            "bookmark_name": "课程资料"
        },
        {
            "id": 2692,
            "bookmark_name": "反省启发"
        },
        {
            "id": 2698,
            "bookmark_name": "统分洞"
        },
        {
            "id": 2892,
            "bookmark_name": "情感小故事"
        },
        {
            "id": 3216,
            "bookmark_name": "吃"
        },
        {
            "id": 3451,
            "bookmark_name": "日更"
        }
    ],
    "message": "success",
    "success": true,
    "timestamp": 1750782515
}
```

# 获取本人（即账号使用者）关注的帖子的某个分组下的帖子
## 请求url
https://treehole.pku.edu.cn/api/follow_v2?page=1&limit=25&bookmark_id=2518

## 响应
与根据关键词搜索得到的返回值格式完全一样