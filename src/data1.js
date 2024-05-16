export default {
	"nodes": [
        {"id": "Lockman-Bechtelar", "group": 1},
        {"id": "Latvia", "group": 2},
        {"id": "Göteborg DC", "group": 3},
        {"id": "EV Car Battery", "group": 4},
        {"id": "Wrocław Production", "group": 5}
      ],
      "links": [
        {"source": "Lockman-Bechtelar", "target": "Latvia", "value": 5},
        {"source": "Latvia", "target": "Göteborg DC", "value": 5},
        {"source": "Göteborg DC", "target": "EV Car Battery", "value": 5},
        {"source": "EV Car Battery", "target": "Wrocław Production", "value": 5},
        {"source": "Mohr Inc", "target": "France", "value": 5}
      ]
    }