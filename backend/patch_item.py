import sys
sys.stdout.reconfigure(encoding='utf-8')
with open('src/controllers/itemController.js', 'r', encoding='utf-8') as f:
    c = f.read()

# Replace bare Notification.create with createNotification helper
old_block = (
    "    // Notify user: new item added\n"
    "    try {\n"
    "      await Notification.create({\n"
    "        userId: req.user.id,\n"
    "        title: `\u2705 New Item Added: ${item.name}`,\n"
    "        message: `${item.name} (${item.category}) has been added to your SmartShelf. Expires: ${new Date(item.expiryDate).toLocaleDateString()}.`,\n"
    "        type: 'system',\n"
    "        read: false,\n"
    "      })\n"
    "    } catch (e) {\n"
    "      console.warn('[itemController] new-item notification failed:', e?.message || e)\n"
    "    }"
)

new_block = (
    "    // Notify user: new item added (in-app + email + push)\n"
    "    try {\n"
    "      await createNotification(\n"
    "        req.user.id.toString(),\n"
    "        `\u2705 New Item Added: ${item.name}`,\n"
    "        `${item.name} (${item.category}) has been added to your SmartShelf. Expires: ${new Date(item.expiryDate).toLocaleDateString()}.`,\n"
    "        'system'\n"
    "      )\n"
    "    } catch (e) {\n"
    "      console.warn('[itemController] new-item notification failed:', e?.message || e)\n"
    "    }"
)

if old_block in c:
    c = c.replace(old_block, new_block)
    with open('src/controllers/itemController.js', 'w', encoding='utf-8') as f:
        f.write(c)
    print("REPLACED OK")
else:
    # Find and show surrounding text
    idx = c.find("Notify user: new item")
    print(f"Found at idx {idx}")
    print(ascii(c[idx:idx+300]))
