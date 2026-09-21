with open('src/controllers/itemController.js', 'r', encoding='utf-8') as f:
    c = f.read()

idx = c.find('Notify user: new item added')
print(repr(c[idx:idx+400]))
