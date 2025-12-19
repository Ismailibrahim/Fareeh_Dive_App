<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Nationality;

class NationalitySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $nationalities = [
            'American',
            'British',
            'Canadian',
            'Australian',
            'German',
            'French',
            'Italian',
            'Spanish',
            'Dutch',
            'Swiss',
            'Swedish',
            'Norwegian',
            'Danish',
            'Finnish',
            'Belgian',
            'Austrian',
            'Irish',
            'New Zealander',
            'Japanese',
            'South Korean',
            'Chinese',
            'Indian',
            'Singaporean',
            'Malaysian',
            'Thai',
            'Indonesian',
            'Filipino',
            'Vietnamese',
            'Brazilian',
            'Argentine',
            'Mexican',
            'South African',
            'Egyptian',
            'Israeli',
            'Emirati',
            'Saudi Arabian',
            'Qatari',
            'Kuwaiti',
            'Bahraini',
            'Omani',
            'Turkish',
            'Greek',
            'Portuguese',
            'Polish',
            'Czech',
            'Hungarian',
            'Romanian',
            'Russian',
            'Ukrainian',
            'Maldivian',
            'Sri Lankan',
            'Bangladeshi',
            'Pakistani',
            'Nepalese',
            'Burmese',
            'Cambodian',
            'Laotian',
            'Taiwanese',
            'Hong Konger',
            'Macanese',
            'Chilean',
            'Colombian',
            'Peruvian',
            'Ecuadorian',
            'Venezuelan',
            'Uruguayan',
            'Paraguayan',
            'Costa Rican',
            'Panamanian',
            'Belizean',
            'Jamaican',
            'Bahamian',
            'Barbadian',
            'Trinidadian',
            'Tobagonian',
            'Fijian',
            'Papua New Guinean',
            'Solomon Islander',
            'Ni-Vanuatu',
            'Palauan',
            'Micronesian',
            'Marshallese',
            'Tongan',
            'Samoan',
            'Cook Islander',
            'Other',
        ];

        foreach ($nationalities as $nationality) {
            Nationality::firstOrCreate(
                ['name' => $nationality],
                ['name' => $nationality]
            );
        }

        $this->command->info('Nationalities seeded successfully!');
    }
}
