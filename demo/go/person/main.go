package main

import (
	"encoding/json"
	"log"
	"os"

	person_pb "exampleperson/person.pb"

	"google.golang.org/protobuf/proto"
)

func main() {
	// Create a new Person message
	person := &person_pb.Person{}
	jsonStr := `{
		"name": "John Doe",
		"age": 30,
		"gender": 1,
		"addresses": [
			{
				"street": "123 Main St",
				"city": "Anytown",
				"state": "CA",
				"zip": "12345"
			},
			{
				"street": "456 Oak St",
				"city": "Othertown",
				"state": "NY",
				"zip": "67890"
			}
		]
	}`
	if err := json.Unmarshal([]byte(jsonStr), person); err != nil {
		log.Fatal("unmarshaling error: ", err)
	}

	// serialize the Person message
	data, err := proto.Marshal(person)
	if err != nil {
		log.Fatal("marshaling error: ", err)
	}

	// write the serialized data to a file
	file, err := os.Create("person.bin")
	if err != nil {
		log.Fatal("file creation error: ", err)
	}
	defer file.Close()
	if n, err := file.Write(data); err != nil {
		log.Fatal("file write error: ", err)
	} else if n != len(data) {
		log.Printf("wrote %d bytes\n", n)
	}
}
