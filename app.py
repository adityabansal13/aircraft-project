from flask import Flask, render_template, request, jsonify
import json
import os
from datetime import datetime
import uuid

app = Flask(__name__)

# Ensure directories exist
os.makedirs('behavior_trees/saved_trees', exist_ok=True)

# Default enemy aircraft behavior tree
ENEMY_AIRCRAFT_BEHAVIOR = {
    "aircraft_id": "ENEMY_001",
    "name": "Enemy Fighter",
    "functionalities": [
        {"id": "takeoff", "name": "TakeOff", "active": True},
        {"id": "navigate", "name": "Navigate", "active": True},
        {"id": "enemydetection", "name": "EnemyDetection", "active": True},
        {"id": "missilenavigation", "name": "MissileNavigation", "active": True},
        {"id": "deployflares", "name": "DeployFlares", "active": True}
    ],
    "behavior_tree": {
        "root": {
            "type": "sequence",
            "children": [
                {"type": "action", "name": "TakeOff"},
                {"type": "action", "name": "Navigate"},
                {"type": "action", "name": "EnemyDetection"},
                {"type": "selector", "children": [
                    {"type": "action", "name": "MissileNavigation"},
                    {"type": "action", "name": "DeployFlares"}
                ]}
            ]
        }
    },
    "created_at": datetime.now().isoformat()
}

# Save enemy aircraft behavior
with open('behavior_trees/enemy_aircraft.json', 'w') as f:
    json.dump(ENEMY_AIRCRAFT_BEHAVIOR, f, indent=2)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/save_aircraft', methods=['POST'])
def save_aircraft():
    try:
        data = request.get_json()
        aircraft_id = str(uuid.uuid4())
        
        # Create behavior tree structure
        behavior_tree = {
            "aircraft_id": aircraft_id,
            "name": data.get('name', f'Aircraft_{aircraft_id[:8]}'),
            "functionalities": data.get('functionalities', []),
            "behavior_tree": generate_behavior_tree(data.get('functionalities', [])),
            "created_at": datetime.now().isoformat()
        }
        
        # Save to file
        filename = f"behavior_trees/saved_trees/{aircraft_id}.json"
        with open(filename, 'w') as f:
            json.dump(behavior_tree, f, indent=2)
        
        return jsonify({
            "success": True,
            "aircraft_id": aircraft_id,
            "message": "Aircraft saved successfully"
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/load_aircraft/<aircraft_id>')
def load_aircraft(aircraft_id):
    try:
        filename = f"behavior_trees/saved_trees/{aircraft_id}.json"
        if not os.path.exists(filename):
            return jsonify({"success": False, "error": "Aircraft not found"}), 404
        
        with open(filename, 'r') as f:
            aircraft_data = json.load(f)
        
        return jsonify({
            "success": True,
            "aircraft": aircraft_data
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/list_aircraft')
def list_aircraft():
    try:
        saved_trees_dir = 'behavior_trees/saved_trees'
        aircraft_list = []
        
        for filename in os.listdir(saved_trees_dir):
            if filename.endswith('.json'):
                with open(os.path.join(saved_trees_dir, filename), 'r') as f:
                    aircraft_data = json.load(f)
                    aircraft_list.append({
                        "id": aircraft_data["aircraft_id"],
                        "name": aircraft_data["name"],
                        "created_at": aircraft_data["created_at"]
                    })
        
        return jsonify({
            "success": True,
            "aircraft": aircraft_list
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/get_enemy_aircraft')
def get_enemy_aircraft():
    try:
        with open('behavior_trees/enemy_aircraft.json', 'r') as f:
            enemy_data = json.load(f)
        
        return jsonify({
            "success": True,
            "enemy": enemy_data
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

def generate_behavior_tree(functionalities):
    """Generate behavior tree from functionalities"""
    if not functionalities:
        return {"root": {"type": "action", "name": "idle"}}
    
    actions = [{"type": "action", "name": func["name"]} for func in functionalities]
    
    return {
        "root": {
            "type": "sequence",
            "children": actions
        }
    }

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
