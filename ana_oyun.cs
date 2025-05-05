using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace age_of_war
{
    public partial class ana_oyun: Form
    {
        public ana_oyun()
        {
            InitializeComponent();
        }

        private void ana_oyun_Load(object sender, EventArgs e)
        {
            panel1.BackgroundImage = Image.FromFile(@"C:\Users\90551\OneDrive\Masaüstü\age_of_war\age_of_war_backcolor.jpg");
            panel1.BackgroundImageLayout = ImageLayout.Stretch; // Görseli panele yay
        }
    }
}
