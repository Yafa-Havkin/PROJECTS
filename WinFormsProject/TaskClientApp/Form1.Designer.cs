namespace TaskClientApp
{
    partial class Form1
    {
        /// <summary>
        ///  Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        ///  Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        ///  Required method for Designer support - do not modify
        ///  the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            headerPanel = new Panel();
            lblTitle = new Label();
            lblSubtitle = new Label();
            rentalInputPanel = new Panel();
            lblCarModel = new Label();
            txtTitle = new TextBox();
            lblRenterName = new Label();
            txtDescription = new TextBox();
            label1 = new Label();
            button1 = new Button();
            lstRentals = new ListBox();
            statusPanel = new Panel();
            lblStatus = new Label();
            dataGridView1 = new DataGridView();
            headerPanel.SuspendLayout();
            rentalInputPanel.SuspendLayout();
            statusPanel.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)dataGridView1).BeginInit();
            SuspendLayout();
            // 
            // headerPanel
            // 
            headerPanel.BackColor = Color.FromArgb(11, 61, 107);
            headerPanel.Controls.Add(lblSubtitle);
            headerPanel.Controls.Add(lblTitle);
            headerPanel.Dock = DockStyle.Top;
            headerPanel.Location = new Point(0, 0);
            headerPanel.Name = "headerPanel";
            headerPanel.Size = new Size(978, 80);
            headerPanel.TabIndex = 0;
            // 
            // lblSubtitle
            // 
            lblSubtitle.AutoSize = true;
            lblSubtitle.Font = new Font("Segoe UI", 11F);
            lblSubtitle.ForeColor = Color.LightGray;
            lblSubtitle.Location = new Point(20, 50);
            lblSubtitle.Name = "lblSubtitle";
            lblSubtitle.Size = new Size(340, 30);
            lblSubtitle.TabIndex = 1;
            lblSubtitle.Text = "מערכת ניהול השכרת רכבים חכמה";
            // 
            // lblTitle
            // 
            lblTitle.AutoSize = true;
            lblTitle.Font = new Font("Segoe UI", 24F, FontStyle.Bold);
            lblTitle.ForeColor = Color.White;
            lblTitle.Location = new Point(20, 15);
            lblTitle.Name = "lblTitle";
            lblTitle.Size = new Size(529, 65);
            lblTitle.TabIndex = 0;
            lblTitle.Text = "🚗 נוכל להשכיר רכבים";
            // 
            // rentalInputPanel
            // 
            rentalInputPanel.BackColor = Color.White;
            rentalInputPanel.BorderStyle = BorderStyle.FixedSingle;
            rentalInputPanel.Controls.Add(button1);
            rentalInputPanel.Controls.Add(txtDescription);
            rentalInputPanel.Controls.Add(lblRenterName);
            rentalInputPanel.Controls.Add(txtTitle);
            rentalInputPanel.Controls.Add(lblCarModel);
            rentalInputPanel.Location = new Point(20, 100);
            rentalInputPanel.Name = "rentalInputPanel";
            rentalInputPanel.Size = new Size(350, 330);
            rentalInputPanel.TabIndex = 1;
            // 
            // button1
            // 
            button1.BackColor = Color.FromArgb(34, 139, 34);
            button1.Font = new Font("Segoe UI", 11F, FontStyle.Bold);
            button1.ForeColor = Color.White;
            button1.Location = new Point(15, 265);
            button1.Name = "button1";
            button1.Size = new Size(320, 40);
            button1.TabIndex = 8;
            button1.Text = "➕ הוסף הסכם";
            button1.UseVisualStyleBackColor = false;
            button1.Click += button1_Click;
            // 
            // txtDescription
            // 
            txtDescription.BorderStyle = BorderStyle.FixedSingle;
            txtDescription.Font = new Font("Segoe UI", 10F);
            txtDescription.Location = new Point(15, 102);
            txtDescription.Name = "txtDescription";
            txtDescription.PlaceholderText = "הכנס את שם הלקוח";
            txtDescription.Size = new Size(320, 34);
            txtDescription.TabIndex = 3;
            // 
            // lblRenterName
            // 
            lblRenterName.AutoSize = true;
            lblRenterName.Font = new Font("Segoe UI", 10F, FontStyle.Bold);
            lblRenterName.ForeColor = Color.FromArgb(11, 61, 107);
            lblRenterName.Location = new Point(15, 80);
            lblRenterName.Name = "lblRenterName";
            lblRenterName.Size = new Size(113, 28);
            lblRenterName.TabIndex = 2;
            lblRenterName.Text = "שם השוכר:";
            // 
            // txtTitle
            // 
            txtTitle.BorderStyle = BorderStyle.FixedSingle;
            txtTitle.Font = new Font("Segoe UI", 10F);
            txtTitle.Location = new Point(15, 42);
            txtTitle.Name = "txtTitle";
            txtTitle.PlaceholderText = "לדוגמה: Toyota Corolla";
            txtTitle.Size = new Size(320, 34);
            txtTitle.TabIndex = 1;
            // 
            // lblCarModel
            // 
            lblCarModel.AutoSize = true;
            lblCarModel.Font = new Font("Segoe UI", 10F, FontStyle.Bold);
            lblCarModel.ForeColor = Color.FromArgb(11, 61, 107);
            lblCarModel.Location = new Point(15, 20);
            lblCarModel.Name = "lblCarModel";
            lblCarModel.Size = new Size(108, 28);
            lblCarModel.TabIndex = 0;
            lblCarModel.Text = "דגם הרכב:";
            // 
            // lstRentals
            // 
            lstRentals.BorderStyle = BorderStyle.FixedSingle;
            lstRentals.Font = new Font("Segoe UI", 9F);
            lstRentals.Location = new Point(20, 450);
            lstRentals.Name = "lstRentals";
            lstRentals.Size = new Size(350, 77);
            lstRentals.TabIndex = 2;
            // 
            // statusPanel
            // 
            statusPanel.BackColor = Color.FromArgb(240, 248, 255);
            statusPanel.BorderStyle = BorderStyle.FixedSingle;
            statusPanel.Controls.Add(lblStatus);
            statusPanel.Location = new Point(390, 100);
            statusPanel.Name = "statusPanel";
            statusPanel.Size = new Size(590, 60);
            statusPanel.TabIndex = 3;
            // 
            // lblStatus
            // 
            lblStatus.AutoSize = true;
            lblStatus.Font = new Font("Segoe UI", 11F);
            lblStatus.ForeColor = Color.FromArgb(11, 61, 107);
            lblStatus.Location = new Point(10, 15);
            lblStatus.Name = "lblStatus";
            lblStatus.Size = new Size(255, 30);
            lblStatus.TabIndex = 0;
            lblStatus.Text = "✅ מערכת מוכנה לעבודה";
            // 
            // dataGridView1
            // 
            dataGridView1.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
            dataGridView1.BackgroundColor = Color.White;
            dataGridView1.ColumnHeadersHeightSizeMode = DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            dataGridView1.Location = new Point(390, 180);
            dataGridView1.Name = "dataGridView1";
            dataGridView1.ReadOnly = true;
            dataGridView1.RowHeadersVisible = false;
            dataGridView1.RowHeadersWidth = 62;
            dataGridView1.SelectionMode = DataGridViewSelectionMode.FullRowSelect;
            dataGridView1.Size = new Size(590, 370);
            dataGridView1.TabIndex = 4;
            // 
            // Form1
            // 
            AutoScaleDimensions = new SizeF(10F, 25F);
            AutoScaleMode = AutoScaleMode.Font;
            BackColor = Color.FromArgb(245, 245, 245);
            ClientSize = new Size(978, 544);
            Controls.Add(dataGridView1);
            Controls.Add(statusPanel);
            Controls.Add(lstRentals);
            Controls.Add(rentalInputPanel);
            Controls.Add(headerPanel);
            FormBorderStyle = FormBorderStyle.FixedSingle;
            MaximumSize = new Size(1000, 600);
            MinimumSize = new Size(1000, 600);
            Name = "Form1";
            Text = "💼 מערכת השכרת רכבים";
            headerPanel.ResumeLayout(false);
            headerPanel.PerformLayout();
            rentalInputPanel.ResumeLayout(false);
            rentalInputPanel.PerformLayout();
            statusPanel.ResumeLayout(false);
            statusPanel.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)dataGridView1).EndInit();
            ResumeLayout(false);
        }

        #endregion

        private Panel headerPanel;
        private Label lblTitle;
        private Label lblSubtitle;
        private Panel rentalInputPanel;
        private Label lblCarModel;
        private TextBox txtTitle;
        private Label lblRenterName;
        private TextBox txtDescription;
        private Button button1;
        private ListBox lstRentals;
        private Panel statusPanel;
        private Label lblStatus;
        private DataGridView dataGridView1;
        private Label label1;
    }
}
