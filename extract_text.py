import json

with open('/home/demmojo/.cursor/projects/home-demmojo-Code-nicheai/agent-transcripts/2892a22c-6649-4ba9-b3d1-c485f8402eb1/2892a22c-6649-4ba9-b3d1-c485f8402eb1.jsonl', 'r') as f:
    for line in f:
        event = json.loads(line)
        if "message" in event:
            msg = event["message"]
            if "toolCalls" in msg:
                for call in msg["toolCalls"]:
                    if call.get("name") == "default_api:StrReplace":
                        args = call.get("arguments", {})
                        if args.get("path", "").endswith("campaignRoutes.test.ts"):
                            print("--------------------------------------------------")
                            print("OLD:")
                            print(args.get("old_string"))
                            print("NEW:")
                            print(args.get("new_string"))
                            print("--------------------------------------------------")
