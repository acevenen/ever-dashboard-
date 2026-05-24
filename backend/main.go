package main

import (
	"encoding/json"
	"log"
	"net/http"
	"time"
)

type DeliveryType string
type DeliveryStatus string

const (
	TypeOnSite    DeliveryType = "ON-SITE"
	TypeCarpool   DeliveryType = "CARPOOL"
	TypePineapple DeliveryType = "PINEAPPLE"
)

const (
	StatusRequested DeliveryStatus = "requested"
	StatusRFS       DeliveryStatus = "rfs"
	StatusBoarded   DeliveryStatus = "boarded"
	StatusPrepped   DeliveryStatus = "prepped"
	StatusRFD       DeliveryStatus = "rfd"
	StatusBlocked   DeliveryStatus = "blocked"
)

type Checklist struct {
	ExteriorClean   bool   `json:"exterior_clean"`
	InteriorClean   bool   `json:"interior_clean"`
	ChargeAbove80   bool   `json:"charge_above_80"`
	ChargerPresent  bool   `json:"charger_present"`
	MatsInstalled   bool   `json:"mats_installed"`
	TirePressureOK  bool   `json:"tire_pressure_ok"`
	PaperworkMatch  bool   `json:"paperwork_match"`
	PlatesInstalled bool   `json:"plates_installed"`
	EverFrame       bool   `json:"ever_frame"`
	ROSInstalled    bool   `json:"ros_installed"`
	NumberOfKeys    int    `json:"number_of_keys"`
	OdometerMileage int    `json:"odometer_mileage"`
	ChargerType     string `json:"charger_type"`
	WarningLights   string `json:"warning_lights"`
	ProfileWiped    bool   `json:"profile_wiped"`
}

type Comment struct {
	Author    string    `json:"author"`
	Text      string    `json:"text"`
	Timestamp time.Time `json:"timestamp"`
	IsFlag    bool      `json:"is_flag"`
}

type Delivery struct {
	ID           string         `json:"id"`
	VIN          string         `json:"vin"`
	Vehicle      string         `json:"vehicle"`
	Customer     string         `json:"customer"`
	DeliveryType DeliveryType   `json:"delivery_type"`
	Status       DeliveryStatus `json:"status"`
	AssignedTo   string         `json:"assigned_to"`
	SubmittedBy  string         `json:"submitted_by"`
	ChargeLevel  int            `json:"charge_level"`
	Location     string         `json:"location"`
	CustomerETA  string         `json:"customer_eta"`
	TradeIn      bool           `json:"trade_in"`
	Blocker      string         `json:"blocker"`
	CustomerNote string         `json:"customer_note"`
	Checklist    Checklist      `json:"checklist"`
	Comments     []Comment      `json:"comments"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
}

var deliveries = []Delivery{
	{
		ID:           "d-001",
		VIN:          "5YJ3E1EA2KF299632",
		Vehicle:      "2019 Tesla Model 3",
		Customer:     "R. Jones",
		DeliveryType: TypeOnSite,
		Status:       StatusBlocked,
		AssignedTo:   "Ace Venenciano",
		SubmittedBy:  "M. Squire",
		ChargeLevel:  25,
		Location:     "Car wash",
		CustomerETA:  "In person now",
		Blocker:      "Charger issue - EA unavailable",
		CustomerNote: "Confirm OEM charger, flashlight, wireless speaker.",
		Checklist:    Checklist{},
		Comments: []Comment{
			{Author: "P. Kim", Text: "Key on my desk, vehicle charging at HQ.", Timestamp: time.Now().Add(-2 * time.Hour)},
			{Author: "J. Pablo", Text: "EA charger failing. Trying another port.", Timestamp: time.Now().Add(-1 * time.Hour)},
		},
		CreatedAt: time.Now().Add(-4 * time.Hour),
		UpdatedAt: time.Now().Add(-30 * time.Minute),
	},
	{
		ID:           "d-002",
		VIN:          "7PDSGCBA5RN030096",
		Vehicle:      "2024 Rivian R1S",
		Customer:     "S. Zaman",
		DeliveryType: TypeOnSite,
		Status:       StatusRFD,
		AssignedTo:   "Ace Venenciano",
		SubmittedBy:  "Danyell",
		ChargeLevel:  80,
		Location:     "HQ",
		CustomerETA:  "Saturday 11am",
		Checklist: Checklist{
			ExteriorClean:  true,
			InteriorClean:  true,
			ChargeAbove80:  true,
			ChargerPresent: true,
			MatsInstalled:  true,
			ROSInstalled:   true,
			NumberOfKeys:   2,
		},
		Comments:  []Comment{},
		CreatedAt: time.Now().Add(-24 * time.Hour),
		UpdatedAt: time.Now().Add(-2 * time.Hour),
	},
}

func enableCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

func handleDeliveries(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(deliveries)
}

func main() {
	http.HandleFunc("/deliveries", handleDeliveries)
	log.Println("Ever Dashboard API running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
