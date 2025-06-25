import json
import os

def process_hole(hole):
    post = hole['text']
    if post == None:
        print("Empty post.")
    comments = hole['comments']
    
    train_samples = []
    
    for i, comment in enumerate(comments):
        previous_comments = []
        for j in range(i):
            prev_comment = comments[j]
            name = prev_comment['name']
            if prev_comment['quote']:
                quote_name = prev_comment.get('quote', {}).get('name_tag', '')
                previous_comments.append(f"[{name}]Re:{quote_name} {prev_comment['text']}")
            else:
                previous_comments.append(f"[{name}]{prev_comment['text']}")
        input_text = post + ''.join(previous_comments)
        output_text = comment['text']
        name = comment['name']
        
        train_samples.append({
            "instruction": "你是一个树洞回复机器人,请你根据已有所有消息和自己的身份来写回复",
            "input": input_text + f"[{name}]",
            "output": f"{output_text}"
        })
    
    return train_samples

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    train_samples = []
    for hole in data:
        if hole['comments'] == [] or hole['text'] == None:
            continue
        train_samples.extend(process_hole(hole))
    
    return train_samples

def main():
    data_dir = './data'
    output_file = './processed_data/train_data_mini.jsonl'
    
    train_samples = []
    for file_name in os.listdir(data_dir):
        if file_name.startswith('data_batch') and file_name.endswith('0.json'):
            file_path = os.path.join(data_dir, file_name)
            train_samples.extend(process_file(file_path))
    
    with open(output_file, 'w', encoding='utf-8') as f:
        for sample in train_samples:
            f.write(json.dumps(sample, ensure_ascii=False) + '\n')
    
    print(f"Generated {len(train_samples)} training samples.")

if __name__ == '__main__':
    main()