import requests
import time
import random
import json
import logging
import os
import re
from config import *

logging.basicConfig(filename='logs/treehole2.log', level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

cur_header_no = 0

headers = [{
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "zh-CN,zh;q=0.9",
        "Authorization": authorization[0],
        "Connection": "keep-alive",
        "Cookie": cookie[0],
        "Host": "treehole.pku.edu.cn",
        "Referer": "https://treehole.pku.edu.cn/web/",
        "Sec-Ch-Ua": "\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\", \"Google Chrome\";v=\"122\"",
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": "\"macOS\"",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Uuid": Uuid[0],
        "X-Xsrf-Token": xsftoken[0]
    },
    {
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "zh-CN,zh;q=0.9",
        "Authorization": authorization[1],
        "Connection": "keep-alive",
        "Cookie": cookie[1],
        "Host": "treehole.pku.edu.cn",
        "Referer": "https://treehole.pku.edu.cn/web/",
        "Sec-Ch-Ua": "\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\", \"Google Chrome\";v=\"122\"",
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": "\"macOS\"",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Uuid": Uuid[0],
        "X-Xsrf-Token": xsftoken[0]
    }]

def get_next_batch_no():
    file_pattern = re.compile(r"data_batch_(\d+).json")
    batch_numbers = []
    for file_name in os.listdir("data"):
        match = file_pattern.match(file_name)
        if match:
            batch_no = int(match.group(1))
            batch_numbers.append(batch_no)
    if not batch_numbers:
        return 1
    return max(batch_numbers) + 1

def find_start_page(start_id, limit=25):
    url = f"{base_url}/pku_hole?page=1&limit=25"
    try:
        response = requests.get(url, headers=headers[cur_header_no], proxies={"http": None, "https": None})
        response.raise_for_status()
        data = response.json()
        end_page = data["data"]["last_page"]
    except requests.exceptions.RequestException as e:
        logging.error(f"获取最后一页页码失败,错误信息: {e}")
        print(f"获取最后一页页码失败,错误信息: {e}")
        return
    if not start_id:
        return 1
    
    left, right = 1, end_page
    while left < right:
        print(f"正在搜索包含起始ID({start_id})的页码,当前搜索范围: {left}-{right}")
        mid = (left + right) // 2
        messages_data = get_messages(mid, limit)
        if messages_data is None:
            logging.error(f"在搜索包含起始ID({start_id})的页码时,获取第{mid}页消息失败")
            print(f"在搜索包含起始ID({start_id})的页码时,获取第{mid}页消息失败")
            return 1
        
        ids = [msg['pid'] for msg in messages_data["data"]["data"]]
        if start_id in ids or (ids[0] > start_id and ids[-1] < start_id):
            return mid
        elif start_id > ids[0]:
            right = mid - 1
        else:
            left = mid + 1
    if left == right:
        print(f"正在搜索包含起始ID({start_id})的页码,当前搜索范围: {left}-{right}")
        messages_data = get_messages(left, limit)
        if messages_data is None:
            logging.error(f"在搜索包含起始ID({start_id})的页码时,获取第{left}页消息失败")
            print(f"在搜索包含起始ID({start_id})的页码时,获取第{left}页消息失败")
            return 1
        ids = [msg['pid'] for msg in messages_data["data"]["data"]]
        if start_id in ids or (ids[0] > start_id and ids[-1] < start_id):
            return left
        
    
    logging.warning(f"未找到包含起始ID({start_id})的页码,将从第1页开始爬取")
    print(f"未找到包含起始ID({start_id})的页码,将从第1页开始爬取")
    return 1

def get_messages(page, limit, max_retries=3, retry_delay=3):
    url = f"{base_url}/pku_hole?page={page}&limit={limit}"
    # headers = {
    #     "Accept": "application/json, text/plain, */*",
    #     "Accept-Encoding": "gzip, deflate, br, zstd",
    #     "Accept-Language": "zh-CN,zh;q=0.9",
    #     "Authorization": authorization,
    #     "Connection": "keep-alive",
    #     "Cookie": cookie,
    #     "Host": "treehole.pku.edu.cn",
    #     "Referer": "https://treehole.pku.edu.cn/web/",
    #     "Sec-Ch-Ua": "\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\", \"Google Chrome\";v=\"122\"",
    #     "Sec-Ch-Ua-Mobile": "?0",
    #     "Sec-Ch-Ua-Platform": "\"macOS\"",
    #     "Sec-Fetch-Dest": "empty",
    #     "Sec-Fetch-Mode": "cors",
    #     "Sec-Fetch-Site": "same-origin",
    #     "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    #     "Uuid": Uuid,
    #     "X-Xsrf-Token": xsftoken
    # }
    for attempt in range(max_retries):
        try:
            response = requests.get(url, headers=headers[cur_header_no])
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            error_msg = f"获取消息列表失败(第{attempt + 1}次尝试),请求URL: {url},错误信息: {e}"
            logging.error(error_msg)
            print(error_msg)  # 同时输出错误信息
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
    
    error_msg = f"获取消息列表失败,已达到最大重试次数({max_retries}),请求URL: {url}"
    logging.error(error_msg)
    print(error_msg) 
    return None

def get_comments(pid, page, limit, max_retries=3, retry_delay=3):
    url = f"{base_url}/pku_comment_v3/{pid}?page={page}&limit={limit}"
    # headers = {
    #     "Accept": "application/json, text/plain, */*",
    #     "Accept-Encoding": "gzip, deflate, br, zstd",
    #     "Accept-Language": "zh-CN,zh;q=0.9",
    #     "Authorization": authorization,
    #     "Connection": "keep-alive",
    #     "Cookie": cookie,
    #     "Host": "treehole.pku.edu.cn",
    #     "Referer": "https://treehole.pku.edu.cn/web/",
    #     "Sec-Fetch-Dest": "empty",
    #     "Sec-Fetch-Mode": "cors",
    #     "Sec-Fetch-Site": "same-origin",
    #     "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    #     "Uuid": Uuid,
    #     "X-XSRF-TOKEN": xsftoken
    # }
    for attempt in range(max_retries):
        try:
            response = requests.get(url, headers=headers[cur_header_no])
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            error_msg = f"获取评论失败(第{attempt + 1}次尝试),请求URL: {url},错误信息: {e}"
            logging.error(error_msg)
            print(error_msg)  # 同时输出错误信息
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
    
    error_msg = f"获取评论失败,已达到最大重试次数({max_retries}),请求URL: {url}"
    logging.error(error_msg)
    print(error_msg)
    return None

def crawl_messages(start_page, end_page, limit, batch_size, start_id=None):
    base_id = start_id
    all_data = []
    file_counter = get_next_batch_no()
    print("Next file no: ", file_counter)
    # return 0
    if start_id:
        start_page = find_start_page(start_id)
        print(start_page, "<-start_page")
    
    start_time = time.time()
    try:
        for page in range(start_page, end_page + 1):
            logging.info(f"正在爬取第{page}页的消息...")
            messages_data = get_messages(page, limit)
            if messages_data is None:
                continue
            if messages_data["data"]["data"][0]['pid'] >= base_id +20000:
                base_id = messages_data["data"]["data"]['pid']
                cur_header_no = (cur_header_no + 1) % len(headers)
            for message in messages_data["data"]["data"]:
                if message['reply'] == 0:
                    continue
                pid = message["pid"]
                logging.info(f"正在获取PID为{pid}的消息的评论...")
                
                comments = []
                current_page = 1
                while True:
                    try:
                        comments_data = get_comments(pid, current_page, limit=15)
                        if comments_data is None:
                            break
                        
                        comments.extend(comments_data["data"]["data"])
                        current_page = comments_data["data"]["current_page"]
                        last_page = comments_data["data"]["last_page"]
                        if current_page >= last_page:
                            break
                        current_page += 1
                        time.sleep(random.uniform(0.1, 0.2))
                    except Exception as e:
                        error_msg = f"获取PID为{pid}的消息的评论失败,错误信息: {e}"
                        logging.error(error_msg)
                        print(error_msg)  # 同时输出错误信息
                        break
                
                structured_comments = []
                for comment in comments:
                    structured_comment = {
                        "cid": comment["cid"],
                        "pid": comment["pid"],
                        "text": comment["text"],
                        "timestamp": comment["timestamp"],
                        "name": comment["name"],
                        "quote": comment["quote"]
                    }
                    structured_comments.append(structured_comment)
                
                message["comments"] = structured_comments
                all_data.append(message)
            
            if len(all_data) >= batch_size:
                new_end_time = time.time()
                elapsed_time = new_end_time - start_time
                logging.info(f"{file_counter*batch_size + 1}-{(file_counter+1)*batch_size}条数据代码运行时间: {elapsed_time} 秒")
                file_name = f"data/data_batch_{file_counter}.json"
                with open(file_name, "w", encoding="utf-8") as f:
                    json.dump(all_data, f, ensure_ascii=False, indent=4)
                logging.info(f"已将{len(all_data)}条数据存储到文件{file_name}")
                all_data = []
                file_counter += 1
                start_time = time.time()
            
            time.sleep(random.uniform(3, 7))
        
        if all_data:
            file_name = f"data_batch_{file_counter}.json"
            with open(file_name, "w", encoding="utf-8") as f:
                json.dump(all_data, f, ensure_ascii=False, indent=4)
            logging.info(f"已将剩余的{len(all_data)}条数据存储到文件{file_name}")
        
        logging.info("数据爬取和存储完成")
    except Exception as e:
        error_msg = f"数据爬取过程中发生异常: {e}"
        logging.exception(error_msg)
        print(error_msg)

