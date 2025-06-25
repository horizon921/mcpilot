from woodpecker import *

# 示例:爬取第3页到第5页的消息,每页25条,每batch_size条数据存储到文件
start_page = 1
end_page = 5800000
limit = 25
batch_size = 1000
start_pid = 5836162
crawl_messages(start_page, end_page, limit, batch_size, start_pid)
# print(find_start_page(1000000))